from rest_framework import filters
from rest_framework import viewsets
from rest_framework.decorators import list_route
from rest_framework.response import Response

from assessment.api import (
    AssessmentLevelPermissions, InAssessmentFilter, DisabledPagination)

from . import models, serializers, lookups
from utils.api import CleanupFieldsBaseViewSet
from utils.helper import tryParseInt


class Study(viewsets.ReadOnlyModelViewSet):
    assessment_filter_args = "assessment"
    model = models.Study
    pagination_class = DisabledPagination
    permission_classes = (AssessmentLevelPermissions, )
    filter_backends = (InAssessmentFilter, filters.DjangoFilterBackend)
    list_actions = ['list', 'rob_scores', ]

    def get_serializer_class(self):
        cls = serializers.VerboseStudySerializer
        if self.action == "list":
            cls = serializers.SimpleStudySerializer
        return cls

    def get_queryset(self):
        if self.action == "list":
            if not self.assessment.user_can_edit_object(self.request.user):
                return self.model.objects.published(self.assessment)
            return self.model.objects.get_qs(self.assessment)
        else:
            return self.model.objects.prefetch_related(
                'identifiers',
                'riskofbiases__scores__metric__domain',
            )

    @list_route()
    def rob_scores(self, request):
        assessment_id = tryParseInt(self.request.query_params.get('assessment_id'), -1)
        scores = self.model.objects.rob_scores(assessment_id)
        return Response(scores)

    @list_route()
    def types(self, request):
        study_types = self.model.STUDY_TYPE_FIELDS
        return Response(study_types)


class FinalRobStudy(Study):
    list_actions = ['list']

    def get_serializer_class(self):
        return serializers.FinalRobStudySerializer


class StudyCleanupFieldsView(CleanupFieldsBaseViewSet):
    model = models.Study
    serializer_class = serializers.StudyCleanupFieldsSerializer


# This API ViewSet is used to search an Assessment's studies for ones that match the incoming 'term' string
class StudySearch(viewsets.ReadOnlyModelViewSet):
    model = models.Study

    assessment_filter_args = ""
    pagination_class = DisabledPagination
    permission_classes = (AssessmentLevelPermissions, )
    filter_backends = (InAssessmentFilter, filters.DjangoFilterBackend)
    serializer_class = serializers.StudyPredictiveLookup

    def list(self, request, *args, **kwargs):
        # By default, return an empty list object
        returnValue = []

        # Run the search and handle the queryset returned
        instance = self.get_queryset()
        if (len(instance) > 0):
            # At least one Study was returned by the search

            # Iterate through the queryset, serialize each one and add it to returnValue
            for study in instance:
                serializer = self.get_serializer(study)
                returnValue.append(serializer.data)

        return Response(returnValue)

    def get_queryset(self):
        # By default, return an empty queryset
        queryset = self.model.objects.none()

        # It is assumed that this request's GET scope has a numeric assessment_id value (due to the permission_classes)
        assessment_id = tryParseInt(self.request.GET.get('assessment_id'))

        if (assessment_id > 0):
            # assessment_id is syntactically value, continue

            # Look for a term value, starting in the GET scope, then checking in the POST scope, and then finally defaulting to an empty string
            term = (self.request.GET.get('term')) if ('term' in self.request.GET) else ((self.request.POST.get('term')) if ('term' in self.request.POST) else (''))
            if (term != ''):
                # A non-empty term was found, search the studies within the assessment, searching in the short_citation and full_citation fields
                queryset = self.model.objects.get_qs(assessment_id).filter(short_citation__icontains=term) | self.model.objects.get_qs(assessment_id).filter(full_citation__icontains=term)

                try:
                    # Try to treat term like an integer and OR the current queryset with a search for this specific Study HAWC primary key
                    queryset = queryset | self.model.objects.get_qs(assessment_id).filter(id=term)
                except:
                    pass

        return queryset


# This API ViewSet is used to search an Assessment's studies for ones that match the incoming 'term' string
class StudySearch(viewsets.ReadOnlyModelViewSet):
    model = models.Study

    assessment_filter_args = ""
    pagination_class = DisabledPagination
    permission_classes = (AssessmentLevelPermissions, )
    filter_backends = (InAssessmentFilter, filters.DjangoFilterBackend)
    serializer_class = serializers.StudyPredictiveLookup

    def list(self, request, *args, **kwargs):
        # By default, return an empty list object
        returnValue = []

        # Run the search and handle the queryset returned
        instance = self.get_queryset()
        if (len(instance) > 0):
            # At least one Study was returned by the search

            # Iterate through the queryset, serialize each one and add it to returnValue
            for study in instance:
                serializer = self.get_serializer(study)
                returnValue.append(serializer.data)

        return Response(returnValue)

    def get_queryset(self):
        # By default, return an empty queryset
        queryset = self.model.objects.none()

        # It is assumed that this request's GET scope has a numeric assessment_id value (due to the permission_classes)
        assessment_id = tryParseInt(self.request.GET.get('assessment_id'))

        if (assessment_id > 0):
            # assessment_id is syntactically value, continue

            # Look for a term value, starting in the GET scope, then checking in the POST scope, and then finally defaulting to an empty string
            term = (self.request.GET.get('term')) if ('term' in self.request.GET) else ((self.request.POST.get('term')) if ('term' in self.request.POST) else (''))
            if (term != ''):
                # A non-empty term was found, search the studies within the assessment, searching in the short_citation and full_citation fields
                queryset = self.model.objects.get_qs(assessment_id).filter(short_citation__icontains=term.lower()) | self.model.objects.get_qs(assessment_id).filter(full_citation__icontains=term)

                try:
                    # Try to treat term like an integer and OR the current queryset with a search for this specific Study HAWC primary key
                    queryset = queryset | self.model.objects.get_qs(assessment_id).filter(id=term)
                except:
                    pass

        return queryset


# This API ViewSet is used to search an Assessment's studies for ones that match the incoming 'term' string
# Unlike the 'StudySearch' ViewSet, key/value pairs returned by this ViewSet are specifically named to correspond to what HAWC's ReactJS
# <Autocomplete /> tag expects
class StudyAutoSuggest(StudySearch):
    model = models.Study

    def list(self, request, *args, **kwargs):
        # By default, return an empty list object
        returnValue = []

        # Run the search and handle the queryset returned
        instance = self.get_queryset()
        if (len(instance) > 0):
            # At least one Study was returned by the search

            # Iterate through the queryset, serialize each one and add it to returnValue
            for study in instance:
                serializer = self.get_serializer(study)

                returnValue.append(
                    {
                        'id': serializer.data['id'],
                        'value': serializer.data['full_citation'],
                    }
                )

        return Response(returnValue)
