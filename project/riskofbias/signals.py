from django.apps import apps
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

import models


@receiver(post_save, sender=models.RiskOfBiasDomain)
@receiver(pre_delete, sender=models.RiskOfBiasDomain)
@receiver(post_save, sender=models.RiskOfBiasMetric)
@receiver(pre_delete, sender=models.RiskOfBiasMetric)
def invalidate_caches_rob_metrics(sender, instance, **kwargs):
    study = apps.get_model('study', 'Study')
    if sender is models.RiskOfBiasDomain:
        assessment_id = instance.assessment_id
    elif sender is models.RiskOfBiasMetric:
        assessment_id = instance.domain.assessment_id

    ids = study.objects\
        .filter(assessment_id=assessment_id)\
        .values_list('id', flat=True)

    study.delete_caches(ids)


@receiver(post_save, sender=models.RiskOfBias)
@receiver(pre_delete, sender=models.RiskOfBias)
@receiver(post_save, sender=models.RiskOfBiasScore)
@receiver(pre_delete, sender=models.RiskOfBiasScore)
def invalidate_caches_risk_of_bias(sender, instance, **kwargs):
    if sender is models.RiskOfBias:
        ids = [instance.id]
    elif sender is models.RiskOfBiasScore:
        ids = [instance.riskofbias.id]

    models.RiskOfBias.delete_caches(ids)
