# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2018-05-14 13:29
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('summary', '0015_auto_20180411_1218'),
    ]

    operations = [
        migrations.AddField(
            model_name='evidenceprofilescenario',
            name='order',
            field=models.PositiveSmallIntegerField(default=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='evidenceprofilestream',
            name='order',
            field=models.PositiveSmallIntegerField(default=1),
            preserve_default=False,
        ),
    ]