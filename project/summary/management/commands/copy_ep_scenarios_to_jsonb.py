from django.apps import apps
from django.core.management.base import BaseCommand, CommandError

from summary.models import EvidenceProfileScenario, EvidenceProfileScenario_JSON
import json


HELP_TEXT = """
        This command copies the Evidence Profile Scenario objects "EvidenceProfileScenario" to their new test counterpart using the JSONB datatype
        for the JSON fields (EvidenceProfileScenario_JSON)
    """


class Command(BaseCommand):
    help = HELP_TEXT

    def handle(self, *args, **options):
        outputMessages = []

        # Get all of the current Scenarios and iterate over them checking to see if it has already been copied to the new model
        sourceScenarios = EvidenceProfileScenario.objects.all().order_by("pk")
        for scenario in sourceScenarios:
            # Look for this Scenario in the new model

            check = EvidenceProfileScenario_JSON.objects.filter(
                scenario_name=scenario.scenario_name,
                outcome=json.loads(scenario.outcome),
                studies=json.loads(scenario.studies),
                confidencefactors_increase=json.loads(scenario.confidencefactors_increase),
                confidencefactors_decrease=json.loads(scenario.confidencefactors_decrease),
                evidenceprofilestream=scenario.evidenceprofilestream,
                hawcuser_id=scenario.hawcuser_id,
                order=scenario.order
            )

            if (len(check) == 0):
                # This Scenario was not found in the new model, copy it over and set an appropriate message

                newScenario = EvidenceProfileScenario_JSON.objects.create(
                    scenario_name=scenario.scenario_name,
                    outcome=json.loads(scenario.outcome),
                    studies=json.loads(scenario.studies),
                    confidencefactors_increase=json.loads(scenario.confidencefactors_increase),
                    confidencefactors_decrease=json.loads(scenario.confidencefactors_decrease),
                    evidenceprofilestream=scenario.evidenceprofilestream,
                    hawcuser_id=scenario.hawcuser_id,
                    order=scenario.order
                )

                outputMessages.append("EvidenceProfileScenario (pk={}) ADDED TO EvidenceProfileScenario_JSON (pk={})".format(scenario.pk, newScenario.pk))
            else:
                # This Scenario was already found in the new model, copy set an appropriate message
                outputMessages.append("EvidenceProfileScenario (pk={}) already exists in EvidenceProfileScenario_JSON (pk={})".format(scenario.pk, check.first().pk))

        for message in outputMessages:
            self.stdout.write(message)
