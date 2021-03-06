# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-12-06 15:56
# Customized by tfeiler, to control the order and add the migrate_duration_observation_value
#
# run via:
#   python manage.py migrate
# reverse (to previous migration) with something like:
#   python manage.py migrate animal 0027_litter_effects_fields_relocation
#
from __future__ import unicode_literals

from django.db import migrations, models

def migrate_duration_observation_value(apps, schema_editor):
    AnimalGroup = apps.get_model('animal', 'AnimalGroup')

    for animal_group in AnimalGroup.objects.all():
        dosing_regime = animal_group.dosing_regime
        print("copying animal_group [%s]/[%s]: duration_observation [%s] -> dosing regime [%s]" % (animal_group.id, animal_group.name, animal_group.duration_observation, dosing_regime.id))
        dosing_regime.duration_observation = animal_group.duration_observation

        dosing_regime.save()


def reverse_migrate_duration_observation_value(apps, schema_editor):
    AnimalGroup = apps.get_model('animal', 'AnimalGroup')

    for animal_group in AnimalGroup.objects.all():
        dosing_regime = animal_group.dosing_regime
        print("copying dosing_regime [%s]: duration_observation [%s] -> animal_group [%s]/[%s]" % (dosing_regime.id, dosing_regime.duration_observation, animal_group.id, animal_group.name))
        animal_group.duration_observation = dosing_regime.duration_observation

        animal_group.save()

class Migration(migrations.Migration):

    dependencies = [
        ('animal', '0027_litter_effects_fields_relocation'),
    ]

    operations = [
        migrations.AddField(
            model_name='dosingregime',
            name='duration_observation',
            field=models.FloatField(blank=True, help_text='Optional: Numeric length of time between start of exposure and outcome assessment in days. This field may be used to sort studies which is why days are used as a common metric.', null=True, verbose_name='Exposure-outcome duration'),
        ),
        migrations.RunPython(migrate_duration_observation_value, reverse_migrate_duration_observation_value),
        migrations.RemoveField(
            model_name='animalgroup',
            name='duration_observation',
        ),
    ]
