from rest_framework import serializers

from assessment.serializers import AssessmentMiniSerializer
from utils.helper import SerializerHelper

from myuser.serializers import HAWCUserSerializer
from . import models


class AssessmentMetricChoiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.RiskOfBiasMetric
        fields = ('id', 'name', 'description')


class AssessmentMetricAnswersSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = models.RiskOfBiasMetricAnswers
        fields = '__all__'


class AssessmentMetricSerializer(serializers.ModelSerializer):
    answers = AssessmentMetricAnswersSerializer(many=True)

    class Meta:
        model = models.RiskOfBiasMetric
        fields = '__all__'


class AssessmentDomainSerializer(serializers.ModelSerializer):
    metrics = AssessmentMetricSerializer(many=True)

    class Meta:
        model = models.RiskOfBiasDomain
        fields = '__all__'


class RiskOfBiasDomainSerializer(serializers.ModelSerializer):
    assessment = AssessmentMiniSerializer(read_only=True)

    class Meta:
        model = models.RiskOfBiasDomain
        fields = '__all__'

class RiskOfBiasMetricAnswersSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.RiskOfBiasMetricAnswers
        fields = '__all__'

class RiskOfBiasMetricSerializer(serializers.ModelSerializer):
    answers = RiskOfBiasMetricAnswersSerializer(many=True, read_only=True)
    domain = RiskOfBiasDomainSerializer(read_only=True)

    class Meta:
        model = models.RiskOfBiasMetric
        fields = '__all__'


class RiskOfBiasScoreSerializer(serializers.ModelSerializer):
    metric = RiskOfBiasMetricSerializer(read_only=True)

    class Meta:
        model = models.RiskOfBiasScore
        fields = ('id', 'score', 'notes', 'metric',)

class RiskOfBiasScorePerEndpointSerializer(serializers.ModelSerializer):
    metric = RiskOfBiasMetricSerializer(read_only=True)

    class Meta:
        model = models.RiskOfBiasScorePerEndpoint
        fields = ('id', 'baseendpoint', 'score', 'notes', 'metric',)


class RiskOfBiasSerializer(serializers.ModelSerializer):
    scores = RiskOfBiasScoreSerializer(read_only=False, many=True, partial=True)
    scoresperendpoint = RiskOfBiasScorePerEndpointSerializer(read_only=False, many=True, partial=True)
    author = HAWCUserSerializer(read_only=True)

    class Meta:
        model = models.RiskOfBias
        fields = ('id', 'author', 'active',
                  'final', 'study', 'created',
                  'last_updated', 'scores', 'scoresperendpoint')

    def update(self, instance, validated_data):
        """
        Updates the nested RiskOfBiasScores with submitted data before updating
        the RiskOfBias instance.
        """
        score_data = validated_data.pop('scores')
        for score, form_data in zip(instance.scores.all(), score_data):
            for field, value in list(form_data.items()):
                setattr(score, field, value)
            score.save()
        scoreperendpoint_data = validated_data.pop('scoresperendpoint')
        
        """for spe in scoreperendpoint_data:
            if spe.get('endpoint') < 1:
                noEndpoint.push(spe)
            else:
                endpointUpdate.push(spe)
				
        for scoreperendpoint, form_data in zip(instance.scoresperendpoint.all(), spe_to_update):
            for field, value in list(form_data.items()):
                setattr(scoreperendpoint, field, value)
            scoreperendpoint.save()""" 
		
        return super().update(instance, validated_data)


class AssessmentMetricScoreSerializer(serializers.ModelSerializer):
    scores = serializers.SerializerMethodField('get_final_score')

    class Meta:
        model = models.RiskOfBiasMetric
        fields = ('id', 'name', 'description', 'scores')

    def get_final_score(self, instance):
        scores = instance.scores.filter(riskofbias__final=True, riskofbias__active=True)
        serializer = RiskOfBiasScoreSerializer(scores, many=True)
        return serializer.data


class AssessmentRiskOfBiasScoreSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.RiskOfBiasScore
        fields = ('id', 'notes', 'score')


SerializerHelper.add_serializer(models.RiskOfBias, RiskOfBiasSerializer)
