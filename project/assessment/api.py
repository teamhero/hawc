import logging

from django.apps import apps
from django.core import exceptions
from django.core.urlresolvers import reverse
from django.db.models import Count
from django.template.defaultfilters import slugify

from rest_framework import permissions, status, viewsets, decorators, filters
from rest_framework.response import Response
from rest_framework.exceptions import APIException
from rest_framework.pagination import PageNumberPagination

from . import models, serializers
from utils.helper import tryParseInt


class RequiresAssessmentID(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Please provide an `assessment_id` argument to your GET request.'


class DisabledPagination(PageNumberPagination):
    page_size = None


def get_assessment_from_query(request):
    """Returns assessment or None."""
    assessment_id = tryParseInt(request.GET.get('assessment_id'))
    if assessment_id is None:
        raise RequiresAssessmentID

    return models.Assessment.objects\
        .get_qs(assessment_id)\
        .first()


class AssessmentLevelPermissions(permissions.BasePermission):

    list_actions = ['list', 'create']

    def has_object_permission(self, request, view, obj):
        if not hasattr(view, 'assessment'):
            view.assessment = obj.get_assessment()
        if request.method in permissions.SAFE_METHODS:
            return view.assessment.user_can_view_object(request.user)
        elif obj == view.assessment:
            return view.assessment.user_can_edit_assessment(request.user)
        else:
            return view.assessment.user_can_edit_object(request.user)

    def has_permission(self, request, view):
        if view.action in self.list_actions:
            logging.info('Permission checked')

            if not hasattr(view, 'assessment'):
                view.assessment = get_assessment_from_query(request)

            if view.assessment is None:
                return False

            return view.assessment.user_can_view_object(request.user)

        return True


class InAssessmentFilter(filters.BaseFilterBackend):
    """
    Filter objects which are in a particular assessment.
    """
    def filter_queryset(self, request, queryset, view):
        list_actions = getattr(view, 'list_actions', ['list'])
        if view.action not in list_actions:
            return queryset

        if not hasattr(view, 'assessment'):
            view.assessment = get_assessment_from_query(request)

        filters = {view.assessment_filter_args: view.assessment.id}
        return queryset.filter(**filters)


class AssessmentViewset(viewsets.ReadOnlyModelViewSet):
    assessment_filter_args = ""
    permission_classes = (AssessmentLevelPermissions, )
    filter_backends = (InAssessmentFilter, )

    def get_queryset(self):
        return self.model.objects.all()


class AssessmentEditViewset(viewsets.ModelViewSet):
    assessment_filter_args = ""
    permission_classes = (AssessmentLevelPermissions, )
    parent_model = models.Assessment
    filter_backends = (InAssessmentFilter, )

    def get_queryset(self):
        return self.model.objects.all()


class AssessmentRootedTagTreeViewset(viewsets.ModelViewSet):
    """
    Base viewset used with utils/models/AssessmentRootedTagTree subclasses
    """
    permission_classes = (AssessmentLevelPermissions, )

    PROJECT_MANAGER = 'PROJECT_MANAGER'
    TEAM_MEMBER = 'TEAM_MEMBER'
    create_requires = TEAM_MEMBER

    def get_queryset(self):
        return self.model.objects.all()

    def list(self, request):
        self.filter_queryset(self.get_queryset())
        data = self.model.get_all_tags(self.assessment.id, json_encode=False)
        return Response(data)

    def create(self, request, *args, **kwargs):
        # get an assessment
        assessment_id = tryParseInt(request.data.get('assessment_id'), -1)
        self.assessment = models.Assessment.objects\
                .get_qs(assessment_id)\
                .first()
        if self.assessment is None:
            raise RequiresAssessmentID

        self.check_editing_permission(request)

        return super().create(request, *args, **kwargs)

    @decorators.detail_route(methods=('patch',))
    def move(self, request, *args, **kwargs):
        instance = self.get_object()
        self.assessment = instance.get_assessment()
        self.check_editing_permission(request)
        instance.moveWithinSiblingsToIndex(request.data['newIndex'])
        return Response({'status': True})

    def check_editing_permission(self, request):
        if self.create_requires == self.PROJECT_MANAGER:
            permissions_check = self.assessment.user_can_edit_assessment
        elif self.create_requires == self.TEAM_MEMBER:
            permissions_check = self.assessment.user_can_edit_object
        else:
            raise ValueError('invalid configuration of `create_requires`')

        if not permissions_check(request.user):
            raise exceptions.PermissionDenied()


class DoseUnitsViewset(viewsets.ReadOnlyModelViewSet):
    model = models.DoseUnits
    serializer_class = serializers.DoseUnitsSerializer
    pagination_class = DisabledPagination

    def get_queryset(self):
        return self.model.objects.all()


class AssessmentEndpointList(AssessmentViewset):
    serializer_class = serializers.AssessmentEndpointSerializer
    assessment_filter_args = "id"
    model = models.Assessment
    pagination_class = DisabledPagination

    def list(self, request, *args, **kwargs):
        """
        List has been optimized for queryset speed; some counts in get_queryset
        and others in the list here; depends on if a "select distinct" is
        required which significantly decreases query speed.
        """

        instance = self.filter_queryset(self.get_queryset())[0]
        app_url = reverse('assessment:clean_extracted_data', kwargs={'pk': instance.id})
        instance.items = []

        # animal
        instance.items.append({
            'count': instance.endpoint_count,
            'title': "animal bioassay endpoints",
            'type': 'ani',
            'url': "{}{}".format(app_url, 'ani/'),
        })

        count = apps.get_model('animal', 'Experiment')\
            .objects\
            .get_qs(instance.id)\
            .count()
        instance.items.append({
            "count": count,
            "title": "animal bioassay experiments",
            'type': 'experiment',
            'url': "{}{}".format(app_url, 'experiment/'),
        })

        count = apps.get_model('animal', 'AnimalGroup')\
            .objects\
            .get_qs(instance.id)\
            .count()
        instance.items.append({
            "count": count,
            "title": "animal bioassay animal groups",
            'type': 'animal-groups',
            'url': "{}{}".format(app_url, 'animal-groups/'),
        })

        count = apps.get_model('animal', 'DosingRegime')\
            .objects\
            .get_qs(instance.id)\
            .count()
        instance.items.append({
            "count": count,
            "title": "animal bioassay dosing regimes",
            'type': 'dosing-regime',
            'url': "{}{}".format(app_url, 'dosing-regime/'),
        })

        # epi
        instance.items.append({
            "count": instance.outcome_count,
            "title": "epidemiological outcomes assessed",
            'type': 'epi',
            'url': "{}{}".format(app_url, 'epi/')
        })

        count = apps.get_model('epi', 'StudyPopulation')\
            .objects\
            .get_qs(instance.id)\
            .count()
        instance.items.append({
            "count": count,
            "title": "epi study populations",
            'type': 'study-populations',
            'url': "{}{}".format(app_url, 'study-populations/'),
        })

        count = apps.get_model('epi', 'Exposure')\
            .objects\
            .get_qs(instance.id)\
            .count()
        instance.items.append({
            "count": count,
            "title": "epi exposures",
            'type': 'exposures',
            'url': "{}{}".format(app_url, 'exposures/'),
        })

        # in vitro
        instance.items.append({
            "count": instance.ivendpoint_count,
            "title": "in vitro endpoints",
            'type': 'in-vitro',
            'url': "{}{}".format(app_url, 'in-vitro/'),
        })

        count = apps.get_model('invitro', 'ivchemical')\
            .objects\
            .get_qs(instance.id)\
            .count()
        instance.items.append({
            "count": count,
            "title": "in vitro chemicals",
            'type': 'in-vitro-chemical',
            'url': "{}{}".format(app_url, 'in-vitro-chemical/'),
        })

        # study
        count = apps.get_model('study', 'Study')\
            .objects\
            .get_qs(instance.id)\
            .count()
        instance.items.append({
            "count": count,
            "title": "studies",
            "type": "study",
            "url": "{}{}".format(app_url, 'study/'),
            })

        
        # reference
        count = apps.get_model('lit', 'Reference')\
            .objects\
            .get_qs(instance.id)\
            .count()
        instance.items.append({
            "count": count,
            "title": "references",
            "type": "reference",
            "url": "{}{}".format(app_url, 'reference/'),
            })

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_queryset(self):
        id_ = tryParseInt(self.request.GET.get('assessment_id'))
        queryset = self.model.objects\
            .get_qs(id_)\
            .annotate(endpoint_count=Count('baseendpoint__endpoint'))\
            .annotate(outcome_count=Count('baseendpoint__outcome'))\
            .annotate(ivendpoint_count=Count('baseendpoint__ivendpoint'))
        return queryset


# This API ViewSet is used to search an Assessment's effect tags for ones that match the incoming 'term' string
class EffectTagSearch(viewsets.ReadOnlyModelViewSet):
    model = models.EffectTag

    pagination_class = DisabledPagination
    filter_backends = (filters.DjangoFilterBackend)
    serializer_class = serializers.EffectTagSerializer

    def list(self, request, *args, **kwargs):
        # By default, return an empty list object
        returnValue = []

        # Run the search and handle the queryset returned
        instance = self.get_queryset()
        if (len(instance) > 0):
            # At least one Study was returned by the search

            # Iterate through the queryset, serialize each one and add it to returnValue
            for effectTag in instance:
                serializer = self.get_serializer(effectTag)
                returnValue.append(serializer.data)

        return Response(returnValue)

    def get_queryset(self):
        # By default, return an empty queryset
        queryset = self.model.objects.none()

        # Look for a term value, starting in the GET scope, then checking in the POST scope, and then finally defaulting to an empty string
        term = (self.request.GET.get('term')) if ('term' in self.request.GET) else ((self.request.POST.get('term')) if ('term' in self.request.POST) else (''))
        if (term != ''):
            # A non-empty term was found, search the effect tags within the assessment, searching in the name field
            queryset = self.model.objects.all().filter(name__icontains=term.lower()) | self.model.objects.all().filter(slug__icontains=term.lower())

            try:
                # Try to treat term like an integer and OR the current queryset with a search for this specific Study HAWC primary key
                queryset = queryset | self.model.objects.all().filter(id=term)
            except:
                pass

        return queryset


# This API ViewSet is used to search an Assessment's effect tags for ones that match the incoming 'term' string
# Unlike the 'EffectTagSearch' ViewSet, key/value pairs returned by this ViewSet are specifically named to correspond to what HAWC's ReactJS corresponding
# <Autocomplete />-based tag expects
class EffectTagAutoSuggest(EffectTagSearch):
    model = models.EffectTag

    def list(self, request, *args, **kwargs):
        # By default, return an empty list object
        returnValue = []

        # Run the search and handle the queryset returned
        instance = self.get_queryset()
        if (len(instance) > 0):
            # At least one Study was returned by the search

            # Iterate through the queryset, serialize each one and add it to returnValue
            for effectTag in instance:
                serializer = self.get_serializer(effectTag)

                returnValue.append(
                    {
                        'id': serializer.data['id'],
                        'name': serializer.data['name'],
                    }
                )

        return Response(returnValue)


# This API ViewSet is used to create an Assessment's effect tags for ones that match the incoming 'term' string
# Unlike the 'EffectTagSearch' ViewSet, key/value pairs returned by this ViewSet are specifically named to correspond to what HAWC's ReactJS corresponding
# <Autocomplete />-based tag expects
class EffectTagCreate(viewsets.ModelViewSet):
    model = models.EffectTag

    pagination_class = DisabledPagination
    permission_classes = (AssessmentLevelPermissions, )
    serializer_class = serializers.EffectTagSerializer

    # This method attempts to create a new effect tag
    # This is only attempted if the HTTP request is of type POST and the necessary CSRF token is included in the request
    def create(self, request, *args, **kwargs):
        # By default, return an empty list object
        returnValue = []

        # Look for a name value, first checking in the POST scope and then finally defaulting to an empty string
        name = (self.request.POST.get("name")) if ("name" in self.request.POST) else ("")
        if (name != ""):
            # A name was found, check to see if it is already in the database as an effect tag
            instance = self.get_queryset(name=name)

            if (len(instance) == 0):
                # This name is not used for an effect tag yet, add it to the database
                effectTag = self.model(name=name, slug=slugify(name))
                effectTag.save()

                # Add the newly-created effect tag to the data being returned
                serializer = self.get_serializer(effectTag)
                returnValue.append(serializer.data)
            else:
                # This name is already used for an effect tag, return it instead
                serializer = self.get_serializer(instance[0])
                returnValue.append(serializer.data)

        return Response(returnValue)

    def get_queryset(self, name=""):
        # By default, return an empty queryset
        queryset = self.model.objects.none()

        if (name != ""):
            # name is not an empty argument, check to see if name is already in the database

            queryset = self.model.objects.all().filter(name__iexact=name.lower()) | self.model.objects.all().filter(slug__iexact=name.lower())
            try:
                # Try to treat term like an integer and OR the current queryset with a search for this specific Study HAWC primary key
                queryset = queryset | self.model.objects.all().filter(id=term)
            except:
                pass

        return queryset
