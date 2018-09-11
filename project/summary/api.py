from assessment.api import AssessmentViewset, DisabledPagination

from . import models, serializers


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


class EvidenceProfile(AssessmentViewset):
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
