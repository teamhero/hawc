# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2017-11-02 21:42
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('riskofbias', '0017_auto_20171102_1508'),
    ]

    operations = [
        migrations.CreateModel(
            name='RiskOfBiasAnswersRecorded',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recorded_score', models.PositiveSmallIntegerField(default=10)),
                ('recorded_notes', models.TextField(blank=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('answers', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='answers_recorded', to='riskofbias.RiskOfBiasMetricAnswers')),
                ('riskofbias', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='answers_recorded', to='riskofbias.RiskOfBias')),
            ],
        ),
    ]