from rest_framework import serializers
from rest_framework.exceptions import ParseError

from assessment.serializers import AssessmentRootedSerializer

from utils.api import DynamicFieldsMixin

from . import models


class IdentifiersSerializer(serializers.ModelSerializer):

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['database'] = instance.get_database_display()
        ret['url'] = instance.get_url()
        return ret

    class Meta:
        model = models.Identifiers
        fields = '__all__'


class ReferenceTagsSerializer(serializers.ModelSerializer):

    def to_internal_value(self, data):
        raise ParseError("Not implemented!")

    def to_representation(self, obj):
        # obj is a model-manager in this case; convert to list to serialize
        return list(obj.values('id', 'name'))


class ReferenceFilterTagSerializer(AssessmentRootedSerializer):
    parent = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = models.ReferenceFilterTag
        fields = ('id', 'name', 'parent')


class ReferenceCleanupFieldsSerializer(DynamicFieldsMixin, serializers.ModelSerializer):

    class Meta:
        model = models.Reference
        cleanup_fields = model.TEXT_CLEANUP_FIELDS
        fields = cleanup_fields + ('id', )

class ReferenceBasicFieldsSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()
    has_tags = serializers.SerializerMethodField()

    class Meta:
        model = models.Reference
        # fields = '__all__'
        fields = ['id', 'title', 'authors', 'year', 'tags', 'has_tags']

    def get_tags(self, obj):
        tags = []
        for t in obj.tags.all():
            tag = {
                "id": t.pk,
                "name": t.name
            }
            tags.append(tag)

        return tags

    def get_has_tags(self, obj):
        return obj.has_tags
