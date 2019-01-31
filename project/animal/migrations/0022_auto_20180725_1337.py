# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-07-25 17:37
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('animal', '0021_auto_20180724_1442'),
    ]

    operations = [
        migrations.AlterField(
            model_name='experiment',
            name='diet',
            field=models.TextField(blank=True, help_text="Copy paste diet/water from materials and methods, use quotation marks around all text directly copy/pasted from paper. If diet is of particular importance in an assessment, then use a short description so it can be displayed in visualizations (e.g., soy-protein free 2020X Teklad). In these cases, the longer materials and methods description can be captured in 'animal husbandry' in the Animal Group extraction module."),
        ),
    ]