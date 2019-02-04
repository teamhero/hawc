# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2018-12-24 20:57
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('summary', '0022_auto_20181205_1644'),
    ]

    operations = [
        migrations.AlterField(
            model_name='datapivot',
            name='assessment',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='datapivots', to='assessment.Assessment'),
        ),
    ]
