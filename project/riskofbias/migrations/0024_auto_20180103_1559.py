# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2018-01-03 20:59
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('riskofbias', '0023_auto_20171214_1256'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='riskofbiasmetricanswers',
            options={'ordering': ('metric', 'answer_order'), 'verbose_name_plural': 'Study Evaluation metric answers'},
        ),
    ]