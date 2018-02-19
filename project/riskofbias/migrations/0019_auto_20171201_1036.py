# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2017-12-01 15:36
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('riskofbias', '0018_riskofbiasmetric_is_overall_confidence'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='riskofbiasmetric',
            name='is_overall_confidence',
        ),
        migrations.AddField(
            model_name='riskofbiasdomain',
            name='is_overall_confidence',
            field=models.BooleanField(default=False, help_text='Is this domain for overall confidence?', verbose_name='Overall confidence?'),
        ),
    ]
