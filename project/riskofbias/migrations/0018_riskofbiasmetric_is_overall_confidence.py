# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2017-12-01 15:14
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('riskofbias', '0017_merge_20171012_1508'),
    ]

    operations = [
        migrations.AddField(
            model_name='riskofbiasmetric',
            name='is_overall_confidence',
            field=models.BooleanField(default=False, help_text='Is this metric for overall confidence?', verbose_name='Overall confidence?'),
        ),
    ]
