# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-06-12 18:28
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assessment', '0014_auto_20180403_1044'),
    ]

    operations = [
        migrations.AlterField(
            model_name='assessment',
            name='enable_project_management',
            field=models.BooleanField(default=True, help_text='Enable project management module for data extraction and study evaluation. If enabled, each study will have multiple tasks which can be assigned and tracked for completion.'),
        ),
    ]
