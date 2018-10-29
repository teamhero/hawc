from collections import OrderedDict
from itertools import groupby

from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.contrib.postgres.aggregates import ArrayAgg

from summary.models import EvidenceProfileScenario, EvidenceProfileScenario_JSON
from study.models import Study
from utils.functions import JSONBArrayElements, JSONBObjectAtPath
import json
import time


HELP_TEXT = """
        This command compares the time required for the current EvidenceProfileScenario objects and the new test EvidenceProfile_JSON objects to retrieve the studies
        whose primary keys are included in the JSONB field 'studies'
	"""


class Command(BaseCommand):
    help = HELP_TEXT

    def handle(self, *args, **options):
        outputMessages = []

        # Start by testing the current EvidenceProfileScenario objects
        outputMessages.append("Testing the current string-based EvidenceProfileScenario objects")

        # Store the current performance counter value before testing the current EvidenceProfileScenario objects
        startProcess = time.perf_counter()

        # Iterate over all EvidenceProfileScenario objects that have more than just an empty studes array
        studies = OrderedDict()
        for scenario in EvidenceProfileScenario.objects.exclude(studies="[]").order_by("pk"):

            # Initialize a blank list and iterate through all Effect Tag groupings within the object's studies
            study_pk = []
            for effectTag in json.loads(scenario.studies):
                if (("studies" in effectTag) and (len(effectTag["studies"]) > 0)):
                    # effectTag contains a non-empty studies array, iterate over it and add each one to study_pk that is not already in the list

                    for study in effectTag["studies"]:
                        if (study not in study_pk):
                            # study is not in study_pk yet, add it now
                            study_pk.append(study)

            if (study_pk != []):
                # This scenario includes studies, save the list of their primary keys in the ordered dictionary object
                studies[scenario.pk] = study_pk

        # Save how long it took to extract these study primary keys
        stringTime = time.perf_counter() - startProcess

        # Iterate over the ordered dictionary that was just built to retrieve each scenario's studies
        for pk, study_pk in studies.items():
            if (study_pk != []):
                # This EvidenceProfileScenario has at least one study, set a "start scenario" output message, retrieve the studies, and then set output meessages
                # for each study

                outputMessages.append("EvidenceProfileScenario pk={}".format(scenario.pk))
                for study in Study.objects.filter(pk__in=study_pk):
                    outputMessages.append("\tStudy pk={}: {}".format(study.pk, study.short_citation))

        outputMessages.append("");
        outputMessages.append("---------------------------------------------------------");
        outputMessages.append("");

        # Start by testing the new EvidenceProfileScenario_JSON objects
        outputMessages.append("Testing the new JSONB-based EvidenceProfileScenario_JSON objects")

        # Store the current performance counter value before testing the new EvidenceProfileScenario_JSON objects
        startProcess = time.perf_counter()

        # Query the database for distinct study ID primary key values stored within the studies JSONB field, and then iterate over them to build an ordered
        # dictionary of scenarios and lists of studies
        studies = OrderedDict()
        for scenario in EvidenceProfileScenario_JSON.objects.all().only("id", "studies").annotate(study_pk=JSONBArrayElements(JSONBObjectAtPath(JSONBArrayElements("studies"), "studies"))).order_by("pk", "study_pk").distinct():
            if (scenario.pk not in studies):
                # This scenario's primary key has net yet been encountered, create a new entry in the studies ordered dictionary and set it's value to a
                # one-element list - that element is this query row's study primary key
                studies[scenario.pk] = [
                    scenario.study_pk
                ]
            else:
                # This scenario already exists in the studies ordered dictionary, append this query row's primary key to it
                studies[scenario.pk].append(scenario.study_pk)

        # Save how long it took to extract these study primary keys
        jsonBTime = time.perf_counter() - startProcess

        # Iterate over the ordered dictionary that was just built to retrieve each scenario's studies
        for pk, study_pk in studies.items():
            if (study_pk != []):
                # This EvidenceProfileScenario has at least one study, set a "start scenario" output message, retrieve the studies, and then set output meessages
                # for each study

                outputMessages.append("EvidenceProfileScenario pk={}".format(scenario.pk))
                for study in Study.objects.filter(pk__in=study_pk):
                    outputMessages.append("\tStudy pk={}: {}".format(study.pk, study.short_citation))

        outputMessages.append("");
        outputMessages.append("---------------------------------------------------------");
        outputMessages.append("");

        # Add output messages displaying the time required to test both EvidenceProfileScenario objects
        outputMessages.append("String - Time Required: {} seconds".format(stringTime))
        outputMessages.append("JSONB  - Time Required: {} seconds".format(jsonBTime))

        for message in outputMessages:
            self.stdout.write(message)
