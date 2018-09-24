# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-09-21 17:49
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invitro', '0008_auto_20180405_0957'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ivendpoint',
            name='monotonicity',
            field=models.PositiveSmallIntegerField(choices=[(8, '--'), (0, 'N/A, single dose level study'), (1, 'N/A, no effects detected'), (2, 'visual appearance of monotonicity'), (3, 'yes, monotonic and significant trend'), (4, 'visual appearance of non-monotonicity'), (6, 'no pattern/unclear')], default=8, help_text='OPTIONAL'),
        ),
    ]
