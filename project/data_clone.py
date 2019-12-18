"""
Prepare database for loading:

```bash
cd ~/dev/temp/hawc-pfas/project
source ../venv/bin/activate

dropdb hawc-pfas
createdb -U hawc hawc
gunzip -c ~/Desktop/tofile/pfas-migrations/hawc_2019-12-12.Thursday.sql.gz | psql -U postgres hawc
psql -d postgres -c "ALTER DATABASE hawc RENAME TO \"hawc-pfas\";"

python manage.py createcachetable
python manage.py migrate


psql -d postgres -c "ALTER DATABASE \"hawc-pfas\" RENAME TO \"hawc\";"

```
"""
from collections import defaultdict
import json
from itertools import chain
import os
import logging
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import django
from django.db.models import Model, QuerySet
from django.db.models.signals import post_save
from django.db import transaction

ROOT = Path(__file__).parents[0].absolute()
sys.path.append(ROOT)
os.chdir(ROOT)

os.environ["DJANGO_SETTINGS_MODULE"] = "hawc.settings.local"
django.setup()
logger = logging.getLogger(__name__)

from assessment.models import Assessment
from study import models as study_models
from lit import models as lit_models
from riskofbias import models as rob_models
from bmd import models as bmd_models
from animal import models as ani_models
from epi import models as epi_models
from invitro import models as iv_models
from summary import models as summary_models
from myuser.models import HAWCUser

from study import signals as study_signals
from lit import signals as lit_signals
from assessment import signals as assess_signals
from riskofbias import signals as rob_signals
from animal import signals as ani_signals
from epi import signals as epi_signals
from bmd import signals as bmd_signals


class Cloner:

    M2M_FIELDS = []

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
        m2ms = self._get_m2m(obj)
        obj.pk = None
        self._set_overrides(obj, overrides)
        obj.save()
        self._set_m2m(obj, m2ms)
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

def disable_signals():
    assert post_save.disconnect(receiver=assess_signals.default_configuration, sender=Assessment) is True
    assert post_save.disconnect(receiver=lit_signals.invalidate_study_cache, sender=lit_models.Reference) is True
    assert post_save.disconnect(receiver=lit_signals.invalidate_tag_cache, sender=lit_models.ReferenceFilterTag) is True
    assert post_save.disconnect(receiver=rob_signals.invalidate_caches_rob_metrics, sender=rob_models.RiskOfBiasDomain) is True
    assert post_save.disconnect(receiver=rob_signals.invalidate_caches_rob_metrics, sender=rob_models.RiskOfBiasMetric) is True
    assert post_save.disconnect(receiver=rob_signals.create_rob_scores, sender=rob_models.RiskOfBiasMetric) is True
    assert post_save.disconnect(receiver=rob_signals.update_study_type_metrics, sender=rob_models.RiskOfBiasMetric) is True
    assert post_save.disconnect(receiver=bmd_signals.invalidate_outcome_cache, sender=bmd_models.SelectedModel) is True
    assert post_save.disconnect(receiver=study_signals.update_study_rob_scores, sender=study_models.Study) is True
    assert post_save.disconnect(receiver=study_signals.invalidate_caches_study, sender=study_models.Study) is True
    assert post_save.disconnect(receiver=study_signals.create_study_tasks, sender=study_models.Study) is True
    assert post_save.disconnect(receiver=ani_signals.invalidate_endpoint_cache, sender=ani_models.Experiment) is True
    assert post_save.disconnect(receiver=ani_signals.invalidate_endpoint_cache, sender=ani_models.AnimalGroup) is True
    assert post_save.disconnect(receiver=ani_signals.invalidate_endpoint_cache, sender=ani_models.DosingRegime) is True
    assert post_save.disconnect(receiver=ani_signals.invalidate_endpoint_cache, sender=ani_models.Endpoint) is True
    assert post_save.disconnect(receiver=ani_signals.invalidate_endpoint_cache, sender=ani_models.EndpointGroup) is True
    assert post_save.disconnect(receiver=rob_signals.invalidate_caches_risk_of_bias, sender=rob_models.RiskOfBias) is True
    assert post_save.disconnect(receiver=rob_signals.invalidate_caches_risk_of_bias, sender=rob_models.RiskOfBiasScore) is True
    assert post_save.disconnect(receiver=epi_signals.invalidate_outcome_cache, sender=epi_models.StudyPopulation) is True
    assert post_save.disconnect(receiver=epi_signals.invalidate_outcome_cache, sender=epi_models.ComparisonSet) is True
    assert post_save.disconnect(receiver=epi_signals.invalidate_outcome_cache, sender=epi_models.Exposure) is True
    assert post_save.disconnect(receiver=epi_signals.invalidate_outcome_cache, sender=epi_models.Group) is True
    assert post_save.disconnect(receiver=epi_signals.invalidate_outcome_cache, sender=epi_models.Outcome) is True
    assert post_save.disconnect(receiver=epi_signals.invalidate_outcome_cache, sender=epi_models.Result) is True
    assert post_save.disconnect(receiver=epi_signals.invalidate_outcome_cache, sender=epi_models.GroupResult) is True
    assert post_save.disconnect(receiver=epi_signals.modify_group_result, sender=epi_models.Group) is True

def apply_lit_tags(study_ids: List[int], cw: Dict):
    # apply the same literature tags previously used in original studies to clones
    lit_models.ReferenceTags.objects.bulk_create([
        lit_models.ReferenceTags(
            tag_id=cw['ref-filter-tags'][tag.tag_id],
            content_object_id=cw['studies'][tag.content_object_id]
        )
        for tag in
        lit_models.ReferenceTags.objects.filter(content_object_id__in=study_ids)
    ])

def apply_ivcategory_tags(study_ids: List[int], cw: Dict):
    raise NotImplementedError("TODO - implement - not needed for this assessment.")


@transaction.atomic
def clone_assessment(
        old_assessment_id: int,
        new_assessment_name: str,
        study_ids: List[int],
        dp_ids: List[int],
        viz_ids: List[int],
    ):

    # clone assessment stuff
    # disable post_create signals
    assessment_cloner = AssessmentCloner()

    new_assessment = assessment_cloner.clone(Assessment.objects.get(id=old_assessment_id), {"name": new_assessment_name})
    new_assessment_id = new_assessment.id
    old_assessment = Assessment.objects.get(id=old_assessment_id)

    # build defaults - NOT copied
    summary_models.SummaryText.build_default(new_assessment)

    cw = defaultdict(dict)
    cw[Assessment.COPY_NAME][old_assessment_id] = new_assessment_id

    cw["ref-filter-tags"] = lit_models.ReferenceFilterTag.copy_tags(new_assessment, old_assessment)
    lit_models.Search.build_default(new_assessment)

    cw["iv-endpoint-categories"] = iv_models.IVEndpointCategory.copy_tags(new_assessment, old_assessment)

    # copy rob logic
    old_assessment.rob_settings.copy_across_assessments(cw)
    for domain in old_assessment.rob_domains.all():
        domain.copy_across_assessments(cw)

    # copy bmd logic
    old_assessment.bmd_settings.copy_across_assessments(cw)
    for bmd_logic_field in old_assessment.bmd_logic_fields.all():
        bmd_logic_field.copy_across_assessments(cw)

    # copy study data
    studies = study_models.Study.objects.filter(id__in=study_ids).order_by('id')
    assert studies.count() == len(studies)
    cw = study_models.Study.copy_across_assessment(studies=studies, assessment=new_assessment, cw=cw, copy_rob=True)

    apply_lit_tags(study_ids, cw)
    # apply_ivcategory_tags(study_ids, cw)

    # copy viz
    visuals = summary_models.Visual.objects.filter(id__in=viz_ids).order_by('id')
    assert visuals.count() == len(viz_ids)
    for visual in visuals:
        visual.copy_across_assessments(cw)

    # copy data-pivots
    dpus = summary_models.DataPivotUpload.objects.filter(id__in=dp_ids).order_by('id')
    dpqs = summary_models.DataPivotQuery.objects.filter(id__in=dp_ids).order_by('id')
    assert dpus.count() + dpqs.count() == len(dp_ids)
    for dp in chain(dpus, dpqs):
        dp.copy_across_assessments(cw)

    with open(f'{new_assessment_name}.json', 'w') as f:
        json.dump(cw, f, indent=True)


def main():
    deactivate_user()
    disable_signals()

    print("PFHxA")
    clone_assessment(
        100000026,
        "PFHxA",
        [100000915, 100000916, 100000917, 100000920, 100000921, 100000922, 100000923, 100000924, 100000978, 100000985, 100000989, 100001039, 100001041, 100001069, 100001323, 100001327, 100001459, 100001462, 100001463, 100001577, 100001579, 100001580, 100001582, 100001584, 100001585, 100001586, 100001588, 100500023, 100505508, 100505509, 100510623, 100510624, 100510887],
        [100000260, 100000261, 100000269, 100000270, 100000315, 100500167, 100500168, 100500169, 100500170, 100500171, 100500177, 100500178, 100500189, 100500194, 100500199, 100500200, 100500223, 100500224, 100500225, 100500226, 100500227, 100500228, 100500229],
        [100500091, 100500094, 100500095, 100500096, 100500099, 100500102, 100500104, 100500109]
    )

    print("PFNA")
    clone_assessment(
        100000026,
        "PFNA",
        [100000893, 100000915, 100000921, 100000922, 100000923, 100000927, 100000930, 100000934, 100000936, 100000937, 100000939, 100000940, 100000941, 100000943, 100000944, 100000946, 100000947, 100000948, 100000949, 100000950, 100000951, 100000953, 100000954, 100000955, 100000956, 100000957, 100000959, 100000960, 100000966, 100000976, 100000977, 100000978, 100000979, 100000980, 100000981, 100000982, 100000983, 100000985, 100000986, 100000987, 100000988, 100000989, 100000992, 100000993, 100000994, 100000995, 100000996, 100000997, 100000998, 100000999, 100001000, 100001001, 100001002, 100001003, 100001017, 100001022, 100001023, 100001026, 100001027, 100001028, 100001029, 100001030, 100001032, 100001033, 100001034, 100001035, 100001036, 100001037, 100001038, 100001039, 100001040, 100001041, 100001043, 100001044, 100001045, 100001046, 100001047, 100001048, 100001049, 100001050, 100001051, 100001052, 100001053, 100001054, 100001055, 100001056, 100001058, 100001059, 100001060, 100001061, 100001063, 100001064, 100001065, 100001066, 100001067, 100001068, 100001069, 100001070, 100001305, 100001306, 100001307, 100001308, 100001309, 100001310, 100001311, 100001312, 100001313, 100001314, 100001315, 100001316, 100001317, 100001318, 100001319, 100001320, 100001321, 100001325, 100001326, 100001327, 100001396, 100001404, 100001405, 100001451, 100001457, 100001458, 100001459, 100001460, 100001461, 100001462, 100001463, 100001577, 100001578, 100001579, 100001580, 100001581, 100001582, 100001583, 100001584, 100001585, 100001587, 100001588, 100001589, 100001630, 100001631, 100001632, 100001633, 100001773, 100001775, 100001776, 100001777, 100001778, 100001779, 100001780, 100001781, 100001782, 100001783, 100001784, 100001797, 100001815, 100001817, 100001818, 100001819, 100001820, 100001822, 100001823, 100001824, 100001825, 100001826, 100001827, 100001828, 100001835, 100001836, 100001837, 100001846, 100001847, 100001848, 100001849, 100001851, 100001852, 100001853, 100001854, 100001855, 100001863, 100001864, 100001964, 100001965, 100001982, 100001983, 100001984, 100002018, 100502334, 100502336, 100502337, 100505496, 100505508, 100505509, 100505510, 100505511, 100505512, 100505513, 100505514, 100505516, 100505517, 100505518, 100509473, 100509474, 100509475, 100509476, 100509477, 100509478, 100509479, 100510696, 100510697, 100510698, 100510699, 100510887, 100510888, 100510897, 100510898, 100510903, 100512996, 100512997, 100512998, 100512999, 100513001, 100513034, 100513037, 100513038, 100515434, 100517444],
        [100000112, 100000234, 100000235, 100000236, 100000237, 100000238, 100000239, 100000291, 100000342, 100000353, 100000366, 100000368, 100000371, 100000379, 100000380, 100000381, 100000384, 100000385, 100500117, 100500204],
        [100000024, 100000055, 100000062, 100000064, 100000078, 100000086, 100000104, 100000110, 100500010, 100500029])

    print("PFDA")
    clone_assessment(
        100000026,
        "PFDA",
        [100000921, 100000936, 100000943, 100000946, 100000947, 100000948, 100000949, 100000950, 100000951, 100000954, 100000960, 100000966, 100000972, 100000973, 100000974, 100000975, 100000976, 100000977, 100000978, 100000979, 100000980, 100000981, 100000982, 100000983, 100000985, 100000986, 100000987, 100000988, 100000989, 100000990, 100000991, 100000992, 100000993, 100000994, 100000995, 100000996, 100000997, 100000998, 100000999, 100001000, 100001001, 100001002, 100001003, 100001004, 100001005, 100001006, 100001007, 100001008, 100001009, 100001010, 100001011, 100001012, 100001013, 100001014, 100001018, 100001041, 100001044, 100001054, 100001064, 100001325, 100001327, 100001404, 100001405, 100001407, 100001451, 100001458, 100001577, 100001578, 100001579, 100001580, 100001581, 100001582, 100001583, 100001584, 100001585, 100001587, 100001588, 100001589, 100001630, 100001631, 100001775, 100001777, 100001778, 100001781, 100001783, 100001797, 100001818, 100001819, 100001820, 100001822, 100001824, 100001825, 100001835, 100001847, 100001849, 100001852, 100001853, 100001863, 100001864, 100001964, 100001965, 100001982, 100001983, 100002018, 100502336, 100505496, 100505508, 100505509, 100505510, 100505511, 100505512, 100505514, 100509473, 100509475, 100509477, 100509478, 100510697, 100510698, 100510887, 100510888, 100510897, 100510898, 100510903, 100512996, 100512997, 100512998, 100512999, 100513034, 100513037, 100513038, 100515434],
        [100000197, 100000200, 100000201, 100000204, 100000208, 100000213, 100000218, 100000233, 100000250, 100000251, 100000275, 100000278, 100000280, 100000281, 100000282, 100000283, 100000312, 100000318, 100000343, 100000382, 100000383, 100500008, 100500009, 100500011, 100500013, 100500014, 100500016, 100500020, 100500022, 100500033, 100500034, 100500035, 100500038, 100500039, 100500049, 100500050, 100500059, 100500060, 100500061, 100500062, 100500067, 100500131, 100500201, 100500208, 100500215, 100500216, 100500217],
        [100000056, 100000061, 100000063, 100000105, 100000106, 100000107, 100000112, 100500007, 100500027, 100500028, 100500031, 100500032, 100500051, 100500059, 100500060, 100500061, 100500062, 100500063, 100500066, 100500085]
    )

    print("PFBA")
    clone_assessment(
        100000026,
        "PFBA",
        [100000973, 100000985, 100001313, 100001323, 100001332, 100001333, 100001334, 100001335, 100001336, 100001337, 100001404, 100001580, 100001584, 100001586, 100001588, 100505508, 100510887],
        [100000292, 100000293, 100000294, 100000295, 100000296, 100000297, 100000298, 100000299, 100000300, 100000301, 100000302, 100000303, 100000304, 100500073, 100500076, 100500077, 100500078, 100500079, 100500080, 100500081, 100500082, 100500084, 100500086, 100500090, 100500150, 100500155, 100500156, 100500158, 100500159, 100500160, 100500161, 100500162, 100500163, 100500164, 100500165],
        [100000084, 100000089, 100500067]
    )

    print("PFHxS")
    clone_assessment(
        100000026,
        "PFHxS",
        [100000921, 100000925, 100000926, 100000930, 100000933, 100000934, 100000936, 100000937, 100000938, 100000939, 100000940, 100000941, 100000942, 100000943, 100000944, 100000946, 100000947, 100000948, 100000949, 100000950, 100000951, 100000952, 100000954, 100000955, 100000956, 100000958, 100000959, 100000960, 100000966, 100000976, 100000977, 100000978, 100000979, 100000981, 100000982, 100000983, 100000986, 100000987, 100000988, 100000989, 100000992, 100000993, 100000995, 100000996, 100000997, 100000999, 100001001, 100001002, 100001003, 100001022, 100001026, 100001027, 100001028, 100001030, 100001032, 100001033, 100001034, 100001035, 100001036, 100001037, 100001038, 100001041, 100001043, 100001044, 100001047, 100001048, 100001049, 100001052, 100001053, 100001054, 100001055, 100001056, 100001058, 100001060, 100001063, 100001065, 100001066, 100001067, 100001069, 100001307, 100001318, 100001322, 100001323, 100001324, 100001325, 100001326, 100001327, 100001328, 100001329, 100001396, 100001404, 100001405, 100001460, 100001461, 100001478, 100001577, 100001578, 100001579, 100001580, 100001581, 100001582, 100001583, 100001584, 100001585, 100001586, 100001587, 100001588, 100001589, 100001630, 100001631, 100001632, 100001633, 100001634, 100001725, 100001774, 100001775, 100001776, 100001777, 100001778, 100001779, 100001780, 100001781, 100001782, 100001783, 100001784, 100001814, 100001815, 100001817, 100001818, 100001819, 100001820, 100001821, 100001822, 100001823, 100001824, 100001825, 100001835, 100001836, 100001837, 100001846, 100001847, 100001848, 100001849, 100001851, 100001853, 100001854, 100001855, 100001863, 100001864, 100001964, 100001965, 100001982, 100001983, 100001984, 100002018, 100502334, 100502336, 100505496, 100505508, 100505509, 100505510, 100505511, 100505512, 100505513, 100505514, 100505515, 100509473, 100509475, 100509476, 100509477, 100509478, 100509479, 100510696, 100510697, 100510698, 100510699, 100510888, 100510897, 100510898, 100510903, 100512996, 100512997, 100512998, 100512999, 100513001, 100513034, 100513037, 100513038, 100515434, 100517444],
        [100000242, 100000243, 100000244, 100000246, 100000247, 100000248, 100000249, 100000268, 100000272, 100000273, 100000284, 100000344, 100000386, 100000387, 100500069, 100500101, 100500102, 100500141, 100500142, 100500149, 100500154, 100500175, 100500206, 100500221],
        [100000054, 100000060, 100000102, 100000108, 100000111, 100500004, 100500005, 100500030, 100500049, 100500052, 100500054, 100500069]
    )


def deactivate_user():
    # deactivate old user ids, and reassign assessments for current user
    new_user = HAWCUser.objects.get(id=100500006)
    for old_user in HAWCUser.objects.filter(id__in=[100000066, 100000039]):

        for assessment in old_user.assessment_pms.all():
            if assessment not in new_user.assessment_pms.all():
                new_user.assessment_pms.add(assessment)
        old_user.assessment_pms.clear()

        for assessment in old_user.assessment_teams.all():
            if assessment not in new_user.assessment_teams.all():
                new_user.assessment_teams.add(assessment)
        old_user.assessment_teams.clear()

        for assessment in old_user.assessment_reviewers.all():
            if assessment not in new_user.assessment_reviewers.all():
                new_user.assessment_reviewers.add(assessment)
        old_user.assessment_reviewers.clear()

        old_user.is_active=False
        old_user.save()

if __name__ == '__main__':
    main()
