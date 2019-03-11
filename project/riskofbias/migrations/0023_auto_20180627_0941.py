# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-06-27 13:41
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('riskofbias', '0022_auto_20180409_1609'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='riskofbias',
            options={'ordering': ('final',), 'verbose_name_plural': 'Study Evaluation'},
        ),
        migrations.AlterField(
            model_name='riskofbiasassessment',
            name='help_text',
            field=models.TextField(default='<p>When a study is entered into the HAWC database for use in an assessment, study evaluation metrics can be entered for a metric of bias for each study. Study evaluation metrics are organized by domain. The following questions are required for evaluation for this assessment.</p>', help_text='Detailed instructions for completing study evaluation assessments.'),
        ),
    ]
