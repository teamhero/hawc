# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2018-02-02 20:09
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('study', '0010_auto_20180103_1559'),
        ('lit', '0010_auto_20170806_1721'),
        ('riskofbias', '0024_auto_20180103_1559'),
    ]

    operations = [
        migrations.CreateModel(
            name='HeroId',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reference_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='heroids', to='lit.Reference')),
                ('study', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='heroidstudy', to='study.Study')),
            ],
        ),
    ]