import json
import logging

import django

from django.apps import apps
from django.db import models, IntegrityError, transaction, connection
from django.db.models import URLField, Q
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist, SuspiciousOperation
from django.template.defaultfilters import slugify as default_slugify
from django.utils.translation import ugettext_lazy as _

from treebeard.mp_tree import MP_Node

from utils.helper import HAWCDjangoJSONEncoder

from . import forms, validators


# This class serves as the base superclass used to create the database interface manager for several objects that are child
# objects of a HAWC Assessment object
class BaseManager(models.Manager):
    # The Assessment-objecte relationship is established in the subclass
    assessment_relation = None

    def get_qs(self, assessment_id=None):
        '''
        Allows for queryset to be filtered on assessment if assessment_id is passed as argument.
        If assessment_id is not passed, then functions identically to .all()
        '''
        if assessment_id:
            return self.assessment_qs(assessment_id)

        return self.get_queryset()

    # Query the database using the defined object-Assessment relationship where the Assessment's primary key has the
    # value in the argument assessment_id
    def assessment_qs(self, assessment_id):
        return self.get_queryset().filter(Q(**{self.assessment_relation: assessment_id}))


@property
def NotImplementedAttribute(self):
    raise NotImplementedError


def get_crumbs(obj, parent=None):
    if parent is None:
        crumbs = []
    else:
        crumbs = parent.get_crumbs()
    if obj.id is not None:
        icon = None
        icon_fetch_method = getattr(obj, 'get_crumbs_icon', None)
        if callable(icon_fetch_method):
            icon = icon_fetch_method()

        crumbs.append((obj.__str__(),  obj.get_absolute_url(), icon))
    else:
        crumbs.append((obj._meta.verbose_name.lower(), ))
    return crumbs


class NonUniqueTagBase(models.Model):
    name = models.CharField(verbose_name=_('Name'), max_length=100)
    slug = models.SlugField(verbose_name=_('Slug'), max_length=100)

    def __str__(self):
        return self.name

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.pk and not self.slug:
            self.slug = self.slugify(self.name)
            if django.VERSION >= (1, 2):
                from django.db import router
                using = kwargs.get("using") or router.db_for_write(
                    type(self), instance=self)
                # Make sure we write to the same db for all attempted writes,
                # with a multi-master setup, theoretically we could try to
                # write and rollback on different DBs
                kwargs["using"] = using
                trans_kwargs = {"using": using}
            else:
                trans_kwargs = {}
            i = 0
            while True:
                i += 1
                try:
                    sid = transaction.savepoint(**trans_kwargs)
                    res = super().save(*args, **kwargs)
                    transaction.savepoint_commit(sid, **trans_kwargs)
                    return res
                except IntegrityError:
                    transaction.savepoint_rollback(sid, **trans_kwargs)
                    self.slug = self.slugify(self.name, i)
        else:
            return super().save(*args, **kwargs)

    def slugify(self, tag, i=None):
        slug = default_slugify(tag)
        if i is not None:
            slug += "_%d" % i
        return slug


class AssessmentRootMixin(object):

    cache_template_taglist = NotImplementedAttribute
    cache_template_tagtree = NotImplementedAttribute

    @classmethod
    def get_assessment_root_name(cls, assessment_id):
        return 'assessment-{pk}'.format(pk=assessment_id)

    @classmethod
    def get_assessment_root(cls, assessment_id):
        try:
            return cls.objects.get(name=cls.get_assessment_root_name(assessment_id))
        except ObjectDoesNotExist:
            return cls.create_root(assessment_id)

    @classmethod
    def get_assessment_qs(cls, assessment_id, include_root=False):
        root = cls.get_assessment_root(assessment_id)
        if include_root:
            return cls.get_tree(root)
        return root.get_descendants()

    @classmethod
    def assessment_qs(cls, assessment_id):
        include_root = False
        if issubclass(cls, AssessmentRootMixin):
            include_root = True
        ids = cls.get_assessment_qs(assessment_id, include_root).order_by('depth').values_list('id', flat=True)
        ids = list(ids)  # force evaluation
        return cls.objects.filter(id__in=ids)

    @classmethod
    def get_all_tags(cls, assessment_id, json_encode=True):
        """
        Get all tags for the selected assessment.
        """
        key = cls.cache_template_tagtree.format(assessment_id)
        tags = cache.get(key)
        if tags:
            logging.info('cache used: {0}'.format(key))
        else:
            root = cls.get_assessment_root(assessment_id)
            try:
                tags = cls.dump_bulk(root)
            except KeyError as e:
                logging.exception(e)
                cls.clean_orphans()
                tags = cls.dump_bulk(root)
                logging.info("ReferenceFilterTag cleanup successful.")
            cache.set(key, tags)
            logging.info('cache set: {0}'.format(key))

        if json_encode:
            return json.dumps(tags, cls=HAWCDjangoJSONEncoder)
        else:
            return tags

    @classmethod
    def clean_orphans(cls):
        """
        Treebeard can sometimes delete parents but retain orphans; this will
        remove all orphans from the tree.
        """
        name = cls.__name__
        logging.warning("{}: attempting to recover...".format(name))
        problems = cls.find_problems()
        cls.fix_tree()
        problems = cls.find_problems()
        logging.warning("{}: problems identified: {}".format(name, problems))
        orphan_ids = problems[2]
        if len(orphan_ids) > 0:
            cursor = connection.cursor()
            for orphan_id in orphan_ids:
                orphan = cls.objects.get(id=orphan_id)
                logging.warning('{} "{}" {} is orphaned [path={}]. Deleting.'.format(
                    name, orphan.name, orphan.id, orphan.path))
                cursor.execute("DELETE FROM {0} WHERE id = %s".format(cls._meta.db_table), [orphan.id])
            cursor.close()

    @classmethod
    def get_descendants_pks(cls, assessment_id):
        # Return a list of all descendant ids
        key = cls.cache_template_taglist.format(assessment_id)
        descendants = cache.get(key)
        if descendants:
            logging.info('cache used: {0}'.format(key))
        else:
            root = cls.get_assessment_root(assessment_id)
            descendants = list(root.get_descendants().values_list('pk', flat=True))
            cache.set(key, descendants)
            logging.info('cache set: {0}'.format(key))
        return descendants

    @classmethod
    def clear_cache(cls, assessment_id):
        keys = (cls.cache_template_taglist.format(assessment_id),
                cls.cache_template_tagtree.format(assessment_id))
        logging.info('removing cache: {0}'.format(', '.join(keys)))
        cache.delete_many(keys)

    @classmethod
    def create_tag(cls, assessment_id, parent_id=None, **kwargs):
        # get parent
        if parent_id:
            descendants = cls.get_descendants_pks(assessment_id=assessment_id)
            if parent_id not in descendants:
                raise ObjectDoesNotExist("parent_id is not a descendant of assessment_id")
            parent = cls.objects.get(pk=parent_id)
        else:
            parent = cls.get_assessment_root(assessment_id)

        # make sure name is valid and not root-like
        if kwargs.get('name') == cls.get_assessment_root_name(assessment_id):
            raise SuspiciousOperation("attempting to create new root")

        # clear cache and create!
        cls.clear_cache(assessment_id)
        return parent.add_child(**kwargs)

    @classmethod
    def create_root(cls, assessment_id, **kwargs):
        """
        Constructor to define root with assessment-creation
        """
        kwargs["name"] = cls.get_assessment_root_name(assessment_id)
        return cls.add_root(**kwargs)

    @classmethod
    def get_maximum_depth(cls, assessment_id):
        # get maximum depth; subtracting root-level
        depth = 0
        descendants = cls\
            .get_assessment_root(assessment_id)\
            .get_descendants()\
            .values_list('depth', flat=True)
        if descendants:
            depth = max(descendants) - 1
        return depth

    def get_assessment_id(self):
        name = self.get_ancestors()[0].name
        return int(name[name.find('-') + 1:])

    def get_assessment(self):
        try:
            assessment_id = self.get_assessment_id()
            Assessment = apps.get_model('assessment', 'Assessment')
            return Assessment.objects.get(id=assessment_id)
        except:
            raise self.__class__.DoesNotExist()

    def moveWithinSiblingsToIndex(self, newIndex):
        siblings = list(self.get_siblings())
        currentPosition = siblings.index(self)

        if currentPosition == newIndex:
            return

        if newIndex == 0:
            self.move(self.get_parent(), pos='first-child')
        else:
            anchor = siblings[newIndex]
            pos = 'left' if (newIndex < currentPosition) else 'right'
            self.move(anchor, pos=pos)

        self.clear_assessment_cache()

    def clear_assessment_cache(self):
        self.clear_cache(self.get_assessment_id())


class AssessmentRootedTagTree(AssessmentRootMixin, MP_Node):
    """
    MPTT tree, with one root-note for each assessment object in database.
    Implements caching of the tree for quick retrieval. Expects relatively
    small tree for each assessment (<1000 nodes).
    """
    name = models.CharField(max_length=128)

    class Meta:
        abstract = True


class CustomURLField(URLField):
    default_validators = [validators.CustomURLValidator()]

    def formfield(self, **kwargs):
        # As with CharField, this will cause URL validation to be performed
        # twice.
        defaults = {
            'form_class': forms.CustomURLField,
        }
        defaults.update(kwargs)
        return super().formfield(**defaults)


def get_distinct_charfield(Cls, assessment_id, field):
    return Cls.filter(assessment_id=assessment_id)\
              .distinct(field)\
              .order_by(field)\
              .values_list(field, flat=True)


def get_distinct_charfield_opts(Cls, assessment_id, field):
    objs = get_distinct_charfield(Cls, assessment_id, field)
    return [(obj, obj) for obj in sorted(objs)]
