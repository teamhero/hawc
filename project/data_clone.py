import json
import os
import logging
import sys
from pathlib import Path
from typing import Dict, List, NamedTuple, Tuple

import django
from django.db.models import Model, QuerySet
from django.db.models.signals import post_save
from django.db import transaction
import pandas as pd


ROOT = Path(__file__).parents[0].absolute()
sys.path.append(ROOT)
os.chdir(ROOT)

os.environ["DJANGO_SETTINGS_MODULE"] = "hawc.settings.local"
django.setup()
logger = logging.getLogger(__name__)

from assessment.models import Assessment, TimeSpentEditing, BaseEndpoint
from study import models as study_models
from lit import models as lit_models
from riskofbias import models as rob_models
from riskofbias import signals


class DataMigration(NamedTuple):
    original_id: int
    new_id: int
    db_table: str
    app_label: str
    model_class: str


class DataMigrations():

    def __init__(self):
        self.migrations = []

    def add(self, old_id: int, new_object: Model):
        self.migrations.append(
            DataMigration(
                old_id,
                new_object.id,
                new_object._meta.db_table,
                new_object._meta.app_label,
                new_object.__class__.__name__
            )
        )

    def to_df(self) -> pd.DataFrame:
        return pd.DataFrame(data=self.migrations, columns=DataMigration._fields)


class Cloner:

    M2M_FIELDS = []

    def __init__(self, migrations: DataMigrations):
        self.migrations = migrations

    def _set_overrides(self, obj, overrides):
        if overrides is not None:
            for key, val in overrides.items():
                setattr(obj, key, val)

    def _get_m2m(self, obj: Model) -> Dict[str, List[Model]]:
        fields = {}
        for field in self.M2M_FIELDS:
            fields[field] = list(getattr(obj, field).all())
        return fields

    def _set_m2m(self, obj: Model, fields: Dict):
        for name, values in fields.items():
            getattr(obj, name).set(values)

    def clone(self, obj: Model, overrides: Dict = None) -> Model:
        logger.info(f'Cloning: #{obj.id}: {obj}')
        old_id = obj.id
        m2ms = self._get_m2m(obj)
        obj.pk = None
        self._set_overrides(obj, overrides)
        obj.save()
        self._set_m2m(obj, m2ms)
        self.migrations.add(old_id, obj)
        return obj

    def clone_qs(self, qs: QuerySet, overrides: Dict = None) -> Tuple[QuerySet, Dict[int, int]]:
        mapping = {}
        new_ids = []
        logger.info(f'Cloning: {qs.count()} {qs.model.__name__}')
        for obj in qs:
            old_id = obj.id
            m2ms = self._get_m2m(obj)
            obj.pk = None
            self._set_overrides(obj, overrides)
            obj.save()
            self._set_m2m(obj, m2ms)
            self.migrations.add(old_id, obj)
            new_ids.append(obj.id)
            mapping[old_id] = obj.id
        return qs.model.objects.filter(id__in=new_ids), mapping


class AssessmentCloner(Cloner):
    M2M_FIELDS = ['project_manager', 'team_members', 'reviewers']


class TimeSpentEditingCloner(Cloner):
    pass


class BaseEndpointCloner(Cloner):
    M2M_FIELDS = ['effects']


class ReferenceCloner(Cloner):
    # M2M_FIELDS = ['searches', 'identifiers']  # todo - ignore searches for now - come back later?
    M2M_FIELDS = ['identifiers']


class RiskOfBiasAssessmentCloner(Cloner):
    pass

class RobDomainCloner(Cloner):

    def clone_qs(self, qs: QuerySet, overrides: Dict = None) -> Tuple[QuerySet, Dict[int, int]]:
        mapping = {}
        new_ids = []
        logger.info(f'Cloning: {qs.count()} {qs.model.__name__}')
        for obj in qs:
            old_id = obj.id
            m2ms = self._get_m2m(obj)
            obj.pk = None
            self._set_overrides(obj, overrides)
            obj.save()
            self._set_m2m(obj, m2ms)
            self.migrations.add(old_id, obj)
            new_ids.append(obj.id)
            mapping[old_id] = obj.id
        return qs.model.objects.filter(id__in=new_ids), mapping


class RobMetricCloner(Cloner):
    pass

class RobCloner(Cloner):
    pass

class RobMetricScoreCloner(Cloner):
    pass


class StudyCloner(Cloner):

    def clone_qs(self, qs: QuerySet, mapping: Dict) -> Tuple[QuerySet, Dict[int, int]]:
        new_ids = []
        logger.info(f'Cloning: {qs.count()} {qs.model.__name__}')
        for obj in qs:
            old_id = obj.id
            m2ms = self._get_m2m(obj)
            obj.pk = None
            self.reference_ptr = lit_models.Reference.get(id=mapping[old_id])
            self._set_overrides(obj, overrides)
            obj.save()
            self._set_m2m(obj, m2ms)
            self.migrations.add(old_id, obj)
            new_ids.append(obj.id)
        return qs.model.objects.filter(id__in=new_ids)


@transaction.atomic
def clone_assessment(old_assessment_id: int, new_assessment_name: str, study_ids: List[int]):
    migrations = DataMigrations()

    # clone assessment stuff
    assessment_cloner = AssessmentCloner(migrations)

    new_assessment = assessment_cloner.clone(Assessment.objects.get(id=old_assessment_id), {"name": new_assessment_name})
    new_assessment_id = new_assessment.id
    old_assessment = Assessment.objects.get(id=old_assessment_id)

    cw = study_models.Study.copy_across_assessment(
        studies=study_models.Study.objects.filter(id__in=study_ids),
        assessment=new_assessment
    )

    assert post_save.disconnect(receiver=signals.invalidate_caches_rob_metrics, sender=rob_models.RiskOfBiasDomain) is True
    assert post_save.disconnect(receiver=signals.invalidate_caches_rob_metrics, sender=rob_models.RiskOfBiasMetric) is True
    assert post_save.disconnect(receiver=signals.create_rob_scores, sender=rob_models.RiskOfBiasMetric) is True
    assert post_save.disconnect(receiver=signals.update_study_type_metrics, sender=rob_models.RiskOfBiasMetric) is True

    # copy rob stuff
    cw[Assessment.COPY_NAME][old_assessment_id] = new_assessment_id
    new_assessment.rob_settings.delete()
    new_assessment.rob_domains.all().delete()

    old_assessment.rob_settings.copy_across_assessments(cw)
    for domain in old_assessment.rob_domains.all():
        domain.copy_across_assessments(cw)
    for rob in rob_models.RiskOfBias.objects.filter(study_id__in=study_ids):
        rob.copy_across_assessments(cw)

    # TODO -BMD stuff


    migrations.to_df().to_csv(f'{new_assessment_name}.csv', index=False)
    with open(f'{new_assessment_name}.json', 'w') as f:
        json.dump(cw, f, indent=True)


def main():
    clone_assessment(100000026, "tester", [100000952, 100000963])


if __name__ == '__main__':
    main()

