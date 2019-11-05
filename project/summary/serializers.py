import json

from rest_framework import serializers

from utils.helper import SerializerHelper

from . import models


class CollectionDataPivotSerializer(serializers.ModelSerializer):

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['url'] = instance.get_absolute_url()
        ret['visual_type'] = instance.visual_type
        return ret

    class Meta:
        model = models.DataPivot
        exclude = ('settings', )


class DataPivotSerializer(CollectionDataPivotSerializer):

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["settings"] = instance.get_settings()
        ret['data_url'] = instance.get_data_url()
        ret['download_url'] = instance.get_download_url()
        return ret


class CollectionVisualSerializer(serializers.ModelSerializer):

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['url'] = instance.get_absolute_url()
        ret['visual_type'] = instance.get_visual_type_display()
        ret["settings"] = json.loads(instance.settings)
        return ret

    class Meta:
        model = models.Visual
        exclude = ('endpoints', )


class VisualSerializer(CollectionVisualSerializer):

    def to_representation(self, instance):
        ret = super().to_representation(instance)

        ret['url_update'] = instance.get_update_url()
        ret['url_delete'] = instance.get_delete_url()

        ret["endpoints"] = [
            SerializerHelper.get_serialized(d, json=False)
            for d in instance.get_endpoints()
        ]

        ret["studies"] = [
            SerializerHelper.get_serialized(d, json=False)
            for d in instance.get_studies()
        ]

        return ret


# This class serializes a collection of Evidence Profiles
class CollectionEvidenceProfileSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        returnValue = super().to_representation(instance)
        returnValue["url"] = instance.get_absolute_url()
        returnValue["url_update"] = instance.get_update_url()
        returnValue["url_delete"] = instance.get_delete_url()
        returnValue["visual_type"] = instance.visual_type

        return returnValue

    class Meta:
        model = models.EvidenceProfile
        fields = "__all__"


class EvidenceProfileSerializer(CollectionEvidenceProfileSerializer):
    def to_representation(self, instance):
        returnValue = super().to_representation(instance)
        returnValue["url_update"] = instance.get_update_url()
        returnValue["url_delete"] = instance.get_delete_url()
        returnValue["visual_type"] = instance.visual_type

        return returnValue
