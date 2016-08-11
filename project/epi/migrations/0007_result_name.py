# -*- coding: utf-8 -*-
# Generated by Django 1.9.9 on 2016-08-10 21:54
from __future__ import unicode_literals

from django.db import migrations, models


def setName(apps, schema_editor):
    Result = apps.get_model('epi', 'Result')
    for res in Result.objects.all():
        res.name = u"{0}: {1}".format(res.comparison_set.name, res.metric.metric)
        res.save()


class Migration(migrations.Migration):

    dependencies = [
        ('epi', '0006_auto_20160614_0952'),
    ]

    operations = [
        migrations.AddField(
            model_name='result',
            name='name',
            field=models.CharField(blank=True, max_length=256),
        ),
        migrations.RunPython(
            setName,
            reverse_code=migrations.RunPython.noop
        ),
        migrations.AlterField(
            model_name='result',
            name='name',
            field=models.CharField(max_length=256),
        ),
    ]
