import json
import os

from django.db import models

from utils.models import get_crumbs, NonUniqueTagBase, CustomURLField, AssessmentRootMixin
from utils.helper import HAWCDjangoJSONEncoder
from myuser.models import HAWCUser
from assessment.models import Assessment, Attachment
from treebeard.mp_tree import MP_Node

# Create your models here.

class Extract(models.Model):
	project_id = models.IntegerField(default=0)

class Category(models.Model):
    category_id = models.IntegerField(default=0)
    category_name = models.CharField(max_length=200)

class Project(models.Model):
    project_id = models.ForeignKey(Category, on_delete=models.CASCADE)
    projectName = models.CharField(max_length=200)
    projectAbbr = models.CharField(max_length=200)
    casrn = models.CharField(max_length=200)

# For HERO Tags
# class ReferenceHEROTag(NonUniqueTagBase, AssessmentRootMixin, MP_Node):
#     cache_template_taglist = 'reference-taglist-assessment-{0}'
#     cache_template_tagtree = 'reference-tagtree-assessment-{0}'

#     @classmethod
#     def get_tag_in_assessment(cls, assessment_pk, tag_id):
#         tag = cls.objects.get(id=tag_id)
#         assert tag.get_root().name == cls.get_assessment_root_name(assessment_pk)
#         return tag

#     @classmethod
#     def build_default(cls, assessment):
#         """
#         Constructor to define default literature-tags.
#         """
#         root = cls.add_root(name=cls.get_assessment_root_name(assessment.pk))
#         hero = root.add_child(name="HERO Tags")

#     @classmethod
#     def copy_tags(cls, copy_to_assessment, copy_from_assessment):
#         # delete existing tags for this assessment
#         old_root = cls.get_assessment_root(copy_to_assessment.pk)
#         old_root.delete()

#         # copy tags from alternative assessment, renaming root-tag
#         root = cls.get_assessment_root(copy_from_assessment.pk)
#         tags = cls.dump_bulk(root)
#         tags[0]['data']['name'] = cls.get_assessment_root_name(copy_to_assessment.pk)
#         tags[0]['data']['slug'] = cls.get_assessment_root_name(copy_to_assessment.pk)

#         # insert as new taglist
#         cls.load_bulk(tags, parent=None, keep_ids=False)
#         cls.clear_cache(copy_to_assessment.pk)

#     @classmethod
#     def get_flattened_taglist(cls, tagslist, include_parent=True):
#         # expects tags dictionary dump_bulk format
#         lst = []

#         def appendChildren(obj, parents):
#             parents = parents + '|' if parents != "" else parents
#             txt = parents + obj['data']['name']
#             lst.append(txt)
#             for child in obj.get('children', []):
#                 appendChildren(child, txt)

#         if include_parent:
#             appendChildren(tagslist[0], "")
#         else:
#             for child in tagslist[0]["children"]:
#                 appendChildren(child, "")

#         return lst