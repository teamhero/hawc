# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2018-03-14 21:10
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('riskofbias', '0027_auto_20180302_1432'),
    ]

    operations = [
        migrations.AddField(
            model_name='riskofbiasscore',
            name='answers',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='scores', to='riskofbias.RiskOfBiasMetricAnswers'),
        ),
    ]