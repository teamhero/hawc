# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-07-24 18:42
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('riskofbias', '0023_auto_20180627_0941'),
    ]

    operations = [
        migrations.AlterField(
            model_name='riskofbiasdomain',
            name='description',
            field=models.TextField(blank=True),
        ),
    ]