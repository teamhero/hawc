from assessment.api import AssessmentViewset, DisabledPagination, AssessmentLevelPermissions, InAssessmentFilter

from rest_framework import permissions, status, viewsets, decorators, filters
from rest_framework.response import Response
from rest_framework.exceptions import APIException
from rest_framework.pagination import PageNumberPagination

from . import models, serializers, views


class DataPivot(AssessmentViewset):
    """
    For list view, return simplified data-pivot view.

    For all other views, use the detailed visual view.
    """
    assessment_filter_args = "assessment"
    model = models.DataPivot
    pagination_class = DisabledPagination

    def get_serializer_class(self):
        cls = serializers.DataPivotSerializer
        if self.action == "list":
            cls = serializers.CollectionDataPivotSerializer
        return cls


class Visual(AssessmentViewset):
    """
    For list view, return all Visual objects for an assessment, but using the
    simplified collection view.

    For all other views, use the detailed visual view.
    """

    assessment_filter_args = "assessment"
    model = models.Visual
    pagination_class = DisabledPagination

    def get_serializer_class(self):
        cls = serializers.VisualSerializer
        if self.action == "list":
            cls = serializers.CollectionVisualSerializer
        return cls


# This API class returns a single EvidenceProfile object
class EvidenceProfile(viewsets.ReadOnlyModelViewSet):
    model = models.EvidenceProfile

    assessment_filter_args = "assessment"
    permission_classes = (AssessmentLevelPermissions, )
    filter_backends = (InAssessmentFilter, filters.DjangoFilterBackend)

    def list(self, request, *args, **kwargs):
        returnValue = {}

        evidenceProfile = self.get_queryset()
        if (len(evidenceProfile) == 1):
            # The query returned the desired Evidence Profile object, convert the complete profile to a dictionary object
            returnValue = views.getCompleteEvidenceProfileDictionary(evidenceProfile[0])

        return Response(returnValue)

    # This method returns the set of objects that will be returned by this API call
    def get_queryset(self):
        returnValue = self.model.objects.none()

        # Look for an incoming integer URL variable assessment_id, defaulting to 0
        assessment_id = 0
        try:
            assessment_id = int(self.request.GET["assessment_id"])
        except:
            pass

        # Look for an incoming integer URL variable id, defaulting to 0
        id = 0
        try:
            id = int(self.request.GET["id"])
        except:
            pass

        if ((assessment_id > 0) and (id > 0)):
            # Both the expected URL variables are present and syntactically valid, get the desired object
            returnValue = self.model.objects.get_qs(assessment_id).filter(id=id)

        return returnValue


class AssessmentEvidenceProfiles(AssessmentViewset):
    """
    For list view, return all EvidenceProfile objects for an assessment, but using the
    simplified collection view.

    For all other views, use the detailed visual view.
    """

    assessment_filter_args = "assessment"
    model = models.EvidenceProfile
    pagination_class = DisabledPagination

    def get_serializer_class(self):
        cls = serializers.EvidenceProfileSerializer
        if self.action == "list":
            cls = serializers.CollectionEvidenceProfileSerializer
        return cls
