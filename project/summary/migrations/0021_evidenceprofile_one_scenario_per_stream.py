# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2018-11-21 16:30
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('summary', '0020_auto_20181120_0818'),
    ]

    operations = [
        migrations.AddField(
            model_name='evidenceprofile',
            name='one_scenario_per_stream',
            field=models.BooleanField(default=False, help_text='This evidence profile table wlll only have one outcome scenario per profile stream'),
        ),
    ]
