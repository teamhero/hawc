# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2018-03-02 20:00
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assessment', '0012_remove_changelog'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='timespentediting',
            options={'verbose_name_plural': 'Time spent editing models'},
        ),
        migrations.AlterField(
            model_name='assessment',
            name='assessment_objective',
            field=models.TextField(blank=True, help_text='Describe the assessment objective(s), research questions, or clarification on the purpose of the assessment.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='cas',
            field=models.CharField(blank=True, help_text='Add a single CAS-number if one is available to describe the assessment, otherwise leave-blank.', max_length=40, verbose_name='Chemical identifier (CAS)'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='conflicts_of_interest',
            field=models.TextField(blank=True, help_text='Describe any conflicts of interest by the assessment-team.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='editable',
            field=models.BooleanField(default=True, help_text='Project-managers and team-members are allowed to edit assessment components.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='enable_bmd',
            field=models.BooleanField(default=True, help_text="Conduct benchmark dose (BMD) modeling on animal bioassay data available in the HAWC database, using the US EPA's Benchmark Dose Modeling Software (BMDS).", verbose_name='Enable BMD modeling'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='enable_data_extraction',
            field=models.BooleanField(default=True, help_text='Extract animal bioassay, epidemiological, or in-vitro data from key references and create customizable, dynamic visualizations or summary data and associated metadata for display.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='enable_literature_review',
            field=models.BooleanField(default=True, help_text='Search or import references from PubMed and other literature databases, define inclusion, exclusion, or descriptive tags, and apply these tags to retrieved literature for your analysis.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='enable_project_management',
            field=models.BooleanField(default=True, help_text='Enable project management module for data extraction and risk of bias. If enabled, each study will have multiple tasks which can be assigned and tracked for completion.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='enable_risk_of_bias',
            field=models.BooleanField(default=True, help_text='Define criteria for a systematic review of literature, and apply these criteria to references in your literature-review. View details on findings and identify areas with a potential risk of bias.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='enable_summary_text',
            field=models.BooleanField(default=True, help_text='Create custom-text to describe methodology and results of the assessment; insert tables, figures, and visualizations to using "smart-tags" which link to other data in HAWC.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='funding_source',
            field=models.TextField(blank=True, help_text='Describe the funding-source(s) for this assessment.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='hide_from_public_page',
            field=models.BooleanField(default=False, help_text='If public, anyone with a link can view, but do not show a link on the public-assessment page.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='name',
            field=models.CharField(help_text='Describe the objective of the health-assessment.', max_length=80, verbose_name='Assessment Name'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='project_manager',
            field=models.ManyToManyField(help_text='Has complete assessment control, including the ability to add team members, make public, or delete an assessment. You can add multiple project-managers.', related_name='assessment_pms', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='public',
            field=models.BooleanField(default=False, help_text='The assessment can be viewed by the general public.'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='reviewers',
            field=models.ManyToManyField(blank=True, help_text='Can view the assessment even if the assessment is not public, but cannot add or change content. You can add multiple reviewers.', related_name='assessment_reviewers', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='team_members',
            field=models.ManyToManyField(blank=True, help_text='Can view and edit assessment components, if project is editable. You can add multiple team-members', related_name='assessment_teams', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='version',
            field=models.CharField(help_text='Version to describe the current assessment (i.e. draft, final, v1).', max_length=80, verbose_name='Assessment Version'),
        ),
        migrations.AlterField(
            model_name='assessment',
            name='year',
            field=models.PositiveSmallIntegerField(help_text='Year with which the assessment should be associated.', verbose_name='Assessment Year'),
        ),
        migrations.AlterField(
            model_name='attachment',
            name='attachment',
            field=models.FileField(upload_to='attachment'),
        ),
        migrations.AlterField(
            model_name='baseendpoint',
            name='effects',
            field=models.ManyToManyField(blank=True, to='assessment.EffectTag', verbose_name='Tags'),
        ),
        migrations.AlterField(
            model_name='baseendpoint',
            name='name',
            field=models.CharField(max_length=128, verbose_name='Endpoint name'),
        ),
        migrations.AlterField(
            model_name='effecttag',
            name='slug',
            field=models.SlugField(help_text='The URL (web address) used to describe this object (no spaces or special-characters).', max_length=128, unique=True),
        ),
        migrations.AlterField(
            model_name='species',
            name='name',
            field=models.CharField(help_text='Enter species in singular (ex: Mouse, not Mice)', max_length=30, unique=True),
        ),
    ]