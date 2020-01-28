from rest_framework import filters
from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination

from django.db.models import Count

from assessment.api import (
    AssessmentLevelPermissions, InAssessmentFilter, AssessmentRootedTagTreeViewset
)

from . import models, serializers

from utils.api import CleanupFieldsBaseViewSet


class ReferenceFilterTag(AssessmentRootedTagTreeViewset):
    model = models.ReferenceFilterTag
    serializer_class = serializers.ReferenceFilterTagSerializer


class ReferenceCleanup(CleanupFieldsBaseViewSet):
    serializer_class = serializers.ReferenceCleanupFieldsSerializer
    model = models.Reference
    assessment_filter_args = "assessment"

class Reference(viewsets.ReadOnlyModelViewSet):
    assessment_filter_args = "assessment"
    serializer_class = serializers.ReferenceBasicFieldsSerializer
    model = models.Reference
    pagination_class = LimitOffsetPagination
    permission_classes = (AssessmentLevelPermissions, )
    filter_backends = (InAssessmentFilter, filters.DjangoFilterBackend, filters.OrderingFilter)
    ordering_fields = ['year', 'title', 'authors']

    def get_queryset(self):
        if self.action == "list":
            qs = None
            if not self.assessment.user_can_edit_object(self.request.user):
                qs = self.model.objects.published(self.assessment)
            else:
                qs = self.model.objects.get_qs(self.assessment)

            # users can specify "tagged_only", "untagged_only", or anything else by passing in an optional "listing_variety" queryparam.
            # by default we'll return everything, but we can optionally annotate the query and 
            # then filter against that "number_of_tags" to return just the asked for variety
            listing_variety = self.request.query_params.get('listing_variety')

            if listing_variety == "tagged_only" or listing_variety == "untagged_only":
                qs = qs.annotate(number_of_tags = Count('tags'))

                if listing_variety == "untagged_only":
                    qs = qs.filter(number_of_tags = 0)
                elif listing_variety == "tagged_only":
                    qs = qs.filter(number_of_tags__gt = 0)

            return qs
        else:
            return self.model.objects.all()
