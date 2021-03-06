# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-09-21 17:49
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('animal', '0023_auto_20180808_1313'),
    ]

    operations = [
        migrations.AlterField(
            model_name='animalgroup',
            name='comments',
            field=models.TextField(blank=True, help_text='Copy paste animal husbandry information from materials and methods, use quotation marks around all text directly copy/pasted from paper.', verbose_name='Animal Source and Husbandry'),
        ),
        migrations.AlterField(
            model_name='animalgroup',
            name='duration_observation',
            field=models.FloatField(blank=True, help_text='Optional: Numeric length of time between start of exposure and outcome assessment in days. This field may be used to sort studies which is why days are used as a common metric.', null=True, verbose_name='Exposure-outcome duration'),
        ),
        migrations.AlterField(
            model_name='animalgroup',
            name='lifestage_assessed',
            field=models.CharField(blank=True, help_text='Definitions: <b>Developmental</b>: Prenatal and perinatal exposure in dams or postnatal exposure in offspring until sexual maturity (~6 weeks in rats and mice). Include studies with pre-mating exposure if the endpoint focus is developmental. <b>Adult</b>: Exposure in sexually mature males or females. <b>Adult (gestation)</b>: Exposure in dams during pregnancy. <b>Multi-lifestage</b>: includes both developmental and adult (i.e., multi-generational studies, exposure that start before sexual maturity and continue to adulthood)', max_length=32),
        ),
        migrations.AlterField(
            model_name='animalgroup',
            name='name',
            field=models.CharField(help_text='\n            Name should be: sex, common strain name, species and use Title Style \n            (e.g. Male Sprague Dawley Rat, Female C57BL/6 Mice, Male and Female \n            C57BL/6 Mice). For developmental studies, include the generation before \n            sex in title (e.g., F1 Male Sprague Dawley Rat or P0 Female C57 Mice)\n            ', max_length=80),
        ),
        migrations.AlterField(
            model_name='animalgroup',
            name='strain',
            field=models.ForeignKey(help_text='When adding a new strain, put the stock in parenthesis, e.g., "Sprague-Dawley (Harlan)."', on_delete=django.db.models.deletion.CASCADE, to='assessment.Strain'),
        ),
        migrations.AlterField(
            model_name='dosingregime',
            name='description',
            field=models.TextField(blank=True, help_text='Cut and paste from methods, use quotation marks around all text directly copy/pasted from paper. Also summarize results of any analytical work done to confirm dose, stability, etc. This can be a narrative summary of tabular information, e.g., "Author\'s present data on the target and actual concentration (Table 1; means &plusmn; SD for entire 13-week period) and the values are very close." '),
        ),
        migrations.AlterField(
            model_name='dosingregime',
            name='duration_exposure_text',
            field=models.CharField(blank=True, help_text='Length of time between start of exposure and outcome assessment, in days when &lt;7 (e.g., 5d), weeks when &ge;7 days to 12 weeks (e.g., 1wk, 12wk), or months when &gt;12 weeks (e.g., 15mon). For repeated measures use descriptions such as "1, 2 and 3 wk".  For inhalations studies, also include hours per day and days per week, e.g., "13wk (6h/d, 7d/wk)." This field is commonly used in visualizations, so use abbreviations (h, d, wk, mon, y) and no spaces between numbers to save space.', max_length=128, verbose_name='Exposure duration (text)'),
        ),
        migrations.AlterField(
            model_name='dosingregime',
            name='negative_control',
            field=models.CharField(choices=[('NR', 'Not-reported'), ('UN', 'Untreated'), ('VT', 'Vehicle-treated'), ('B', 'Untreated + Vehicle-treated'), ('N', 'No')], default='VT', help_text='Description of negative-controls used', max_length=2),
        ),
        migrations.AlterField(
            model_name='dosingregime',
            name='positive_control',
            field=models.NullBooleanField(choices=[(True, 'Yes'), (False, 'No'), (None, 'Unknown')], default=False, help_text='Was a positive control used?'),
        ),
        migrations.AlterField(
            model_name='dosingregime',
            name='route_of_exposure',
            field=models.CharField(choices=[('OR', 'Oral'), ('OC', 'Oral capsule'), ('OD', 'Oral diet'), ('OG', 'Oral gavage'), ('OW', 'Oral drinking water'), ('I', 'Inhalation'), ('IG', 'Inhalation - gas'), ('IR', 'Inhalation - particle'), ('IA', 'Inhalation - vapor'), ('D', 'Dermal'), ('SI', 'Subcutaneous injection'), ('IP', 'Intraperitoneal injection'), ('IV', 'Intravenous injection'), ('IO', 'in ovo'), ('P', 'Parental'), ('W', 'Whole body'), ('M', 'Multiple'), ('U', 'Unknown'), ('O', 'Other')], help_text='Primary route of exposure. If multiple primary-exposures, enter as a new dosing regimen.', max_length=2),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='FEL',
            field=models.SmallIntegerField(default=-999, help_text='OPTIONAL: Frank effect level', verbose_name='FEL'),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='data_location',
            field=models.CharField(blank=True, help_text='Details on where the data are found in the literature (ex: "Figure 1", "Table 2", "Text, p. 24", "Figure 1 and Text, p.24")', max_length=128),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='diagnostic',
            field=models.TextField(blank=True, help_text='List the endpoint/adverse outcome name as used in the study. This will help during QA/QC of the extraction to the original study in cases where the endpoint/adverse outcome name is adjusted for consistency across studies or assessments.', verbose_name='Endpoint Name in Study'),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='effect',
            field=models.CharField(blank=True, help_text='Please reference terminology referencefile and use Title Style. Commonly used effects include "Histopathology", "Malformation," "Growth", "Clinical Chemistry", "Mortality," "Organ Weight."', max_length=128),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='effect_subtype',
            field=models.CharField(blank=True, help_text='Please reference terminology reference file and use Title Style. Commonly used effects include "Neoplastic", "Non-Neoplastic," "Feed Consumption", "Fetal Survival", "Body Weight," "Body Weight Gain," "Body Length". For Malformation effects, effect subtypes can be "Skeletal Malformation", "External Malformation" "Soft Tissue." For organ weight effects, subtypes can be "Absolute," "Relative" (absolute can be inferred when it\'s not explicitly stated).', max_length=128),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='endpoint_notes',
            field=models.TextField(blank=True, help_text='Cut and paste from methods, use quotation marks around all text directly copy/pasted from paper. Include all methods pertinent to measuring ALL outcomes, including statistical methods. This will make it easier to copy from existing HAWC endpoints to create new endpoints for a study.', verbose_name='Methods'),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='expected_adversity_direction',
            field=models.PositiveSmallIntegerField(choices=[(3, 'increase from reference/control group'), (2, 'decrease from reference/control group'), (1, 'any change from reference/control group'), (0, 'unclear'), (4, '---')], default=4, help_text='Response direction which would be considered adverse', verbose_name='Expected response adversity direction'),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='monotonicity',
            field=models.PositiveSmallIntegerField(choices=[(8, '--'), (0, 'N/A, single dose level study'), (1, 'N/A, no effects detected'), (2, 'visual appearance of monotonicity'), (3, 'yes, monotonic and significant trend'), (4, 'visual appearance of non-monotonicity'), (6, 'no pattern/unclear')], default=8, help_text='OPTIONAL'),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='observation_time_units',
            field=models.PositiveSmallIntegerField(choices=[(0, 'not reported'), (1, 'seconds'), (2, 'minutes'), (3, 'hours'), (4, 'days'), (5, 'weeks'), (6, 'months'), (9, 'years'), (7, 'post-natal day'), (8, 'gestational day')], default=0),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='organ',
            field=models.CharField(blank=True, help_text='Relevant organ or tissue', max_length=128, verbose_name='Organ (and tissue)'),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='results_notes',
            field=models.TextField(blank=True, help_text='\n            Qualitative description of the results. This field can be \n            left blank if there is no need to further describe numerically \n            extracted findings, e.g., organ or body weights. Use this \n            field to describe findings such as the type and severity \n            of histopathology or malformations not otherwise captured \n            in the numerical data extraction. Also use this field to cut \n            and paste findings described only in text in the study. If \n            coding is used to create exposure-response arrays, then add \n            this comment in bold font at the start of the text box entry \n            <strong>"For exposure-response array data display purposes, the following \n            results were coded (control and no effect findings were coded as \n            "0", treatment-related increases were coded as "1", and \n            treatment-related decreases were coded as "-1"."</strong>\n            '),
        ),
        migrations.AlterField(
            model_name='endpoint',
            name='statistical_test',
            field=models.CharField(blank=True, help_text="Short description of statistical analysis techniques used, e.g., Fisher Exact Test, ANOVA, Chi Square, Peto's test, none conducted", max_length=256),
        ),
        migrations.AlterField(
            model_name='experiment',
            name='cas',
            field=models.CharField(blank=True, help_text='\n                CAS number for chemical-tested. Use N/A if not applicable. If more than one \n                CAS number is applicable, then use a common one here and indicate others \n                in the comment field below.\n                ', max_length=40, verbose_name='Chemical identifier (CAS)'),
        ),
        migrations.AlterField(
            model_name='experiment',
            name='diet',
            field=models.TextField(blank=True, help_text='Describe diet as presented in the paper (e.g., "soy-protein free 2020X Teklad," "Atromin 1310", "standard rodent chow").'),
        ),
        migrations.AlterField(
            model_name='experiment',
            name='guideline_compliance',
            field=models.CharField(blank=True, help_text='\n            Description of any compliance methods used (i.e. use of EPA OECD, NTP, \n            or other guidelines; conducted under GLP guideline conditions, non-GLP but consistent \n            with guideline study, etc.). This field response should match any description used \n            in study evaluation in the reporting quality domain, e.g., GLP study (OECD guidelines \n            414 and 412, 1981 versions). If not reported, then use state "not reported."\n            ', max_length=128),
        ),
        migrations.AlterField(
            model_name='experiment',
            name='litter_effects',
            field=models.CharField(choices=[('NA', 'Not applicable'), ('NR', 'Not reported'), ('YS', 'Yes, statistical control'), ('YD', 'Yes, study-design'), ('N', 'No'), ('O', 'Other')], default='NA', help_text='Type of controls used for litter-effects. The "No" response will be infrequently used. More typically the information will be "Not reported" and assumed not considered. Only use "No" if it is explicitly mentioned in the study that litter was not controlled for.', max_length=2),
        ),
        migrations.AlterField(
            model_name='experiment',
            name='vehicle',
            field=models.CharField(blank=True, help_text='Describe vehicle (use name as described in methods but also add the common name if the vehicle was described in a non-standard way). Enter "not reported" if the vehicle is not described. For inhalation studies, air can be inferred if not explicitly reported. Examples: "corn oil," "filtered air," "not reported, but assumed clean air."', max_length=64, verbose_name='Chemical vehicle'),
        ),
    ]
