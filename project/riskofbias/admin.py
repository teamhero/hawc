from django.contrib import admin

from . import models


class RiskOfBiasMetricAdmin(admin.ModelAdmin):
    list_display = ('domain', 'name', 'created', 'last_updated')

class RiskOfBiasMetricAnswerAdmin(admin.ModelAdmin):
    list_display = ('score', 'metric', 'choice', 'symbol', 'answer_score', 'shade', 'order')
    raw_id_fields = ('score', 'metric',)

admin.site.register(models.RiskOfBiasMetric, RiskOfBiasMetricAdmin)
admin.site.register(models.RiskOfBiasMetricAnswers, RiskOfBiasMetricAnswerAdmin)
