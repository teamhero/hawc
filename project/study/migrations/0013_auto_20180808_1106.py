# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-08-08 15:06
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('study', '0012_auto_20180627_0941'),
    ]

    operations = [
        migrations.AlterField(
            model_name='study',
            name='ask_author',
            field=models.TextField(blank=True, help_text='Details on correspondence between data-extractor and author, if needed. Please include data and details of the correspondence. The files documenting the correspondence can also be added to HAWC as attachments and HERO as a new record, but first it is important to redact confidential or personal information (e.g., email address).', verbose_name='Correspondence details'),
        ),
    ]
