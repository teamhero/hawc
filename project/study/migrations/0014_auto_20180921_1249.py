# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-09-21 17:49
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('study', '0013_auto_20180808_1106'),
    ]

    operations = [
        migrations.AddField(
            model_name='study',
            name='editable',
            field=models.BooleanField(default=True, help_text='Project-managers and team-members are allowed to edit this study.'),
        ),
        migrations.AlterField(
            model_name='study',
            name='ask_author',
            field=models.TextField(blank=True, help_text='Details on correspondence between data-extractor and author (if author contacted). Please include date and details of the correspondence. The files documenting the correspondence can also be added to HAWC as attachments and HERO as a new record, but first it is important to redact confidential or personal information (e.g., email address).', verbose_name='Correspondence details'),
        ),
        migrations.AlterField(
            model_name='study',
            name='funding_source',
            field=models.TextField(blank=True, help_text='When reported, cut and paste the funding source information with quotations, e.g., "The study was sponsored by Hoechst AG and Dow Europe".'),
        ),
        migrations.AlterField(
            model_name='study',
            name='short_citation',
            field=models.CharField(help_text='\n                Use this format: last name, year, HERO ID (e.g., Baeder, 1990, 10130). This field \n                is used to select studies for visualizations and endpoint filters within HAWC, so \n                you may need to add distinguishing features such as chemical name when the \n                assessment includes multiple chemicals (e.g., Baeder, 1990, 10130 PFHS). Note: \n                Brackets can be added to put the references in LitCiter format in document text, \n                e.g., {Baeder, 1990, 10130} or {Baeder, 1990, 10130@@author-year}, but LitCiter \n                will not work on HAWC visuals.\n                ', max_length=256),
        ),
        migrations.AlterField(
            model_name='study',
            name='study_identifier',
            field=models.CharField(blank=True, help_text='\n                This field may be used in HAWC visualizations when there is a preference not to \n                display the HERO ID number, so use author year format, e.g., Smith, 1978, Smith \n                and Jones, 1978 or Smith et al., 1978 (for more than 3 authors).\n                ', max_length=128, verbose_name='Internal study identifier'),
        ),
    ]
