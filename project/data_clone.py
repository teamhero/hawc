from collections import defaultdict
import json
from itertools import chain
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

from assessment.models import Assessment

from study import models as study_models
from lit import models as lit_models
from riskofbias import models as rob_models
from bmd import models as bmd_models
from animal import models as ani_models
from summary import models as summary_models

from study import signals as study_signals
from assessment import signals as assess_signals
from riskofbias import signals as rob_signals
from bmd import signals as bmd_signals
from animal import signals as ani_signals


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
        old_id = obj.id
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
    assert post_save.disconnect(receiver=assess_signals.default_configuration, sender=Assessment) is True
    assessment_cloner = AssessmentCloner()

    new_assessment = assessment_cloner.clone(Assessment.objects.get(id=old_assessment_id), {"name": new_assessment_name})
    new_assessment_id = new_assessment.id
    old_assessment = Assessment.objects.get(id=old_assessment_id)

    # build defaults - NOT copied
    summary_models.SummaryText.build_default(new_assessment)

    cw = defaultdict(dict)
    cw[Assessment.COPY_NAME][old_assessment_id] = new_assessment_id

    lit_models.ReferenceFilterTag.copy_tags(old_assessment, new_assessment)
    # todo apply tags to new reference clones

    # TODO - copy invitro tags

    # copy rob logic
    # disable post_create signals
    assert post_save.disconnect(receiver=rob_signals.invalidate_caches_rob_metrics, sender=rob_models.RiskOfBiasDomain) is True
    assert post_save.disconnect(receiver=rob_signals.invalidate_caches_rob_metrics, sender=rob_models.RiskOfBiasMetric) is True
    assert post_save.disconnect(receiver=rob_signals.create_rob_scores, sender=rob_models.RiskOfBiasMetric) is True
    assert post_save.disconnect(receiver=rob_signals.update_study_type_metrics, sender=rob_models.RiskOfBiasMetric) is True
    old_assessment.rob_settings.copy_across_assessments(cw)
    for domain in old_assessment.rob_domains.all():
        domain.copy_across_assessments(cw)

    # copy bmd logic
    assert post_save.disconnect(receiver=bmd_signals.invalidate_outcome_cache, sender=bmd_models.SelectedModel) is True
    old_assessment.bmd_settings.copy_across_assessments(cw)
    for bmd_logic_field in old_assessment.bmd_logic_fields.all():
        bmd_logic_field.copy_across_assessments(cw)

    # copy study data
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
    studies = study_models.Study.objects.filter(id__in=study_ids)
    assert studies.count() == len(studies)
    cw = study_models.Study.copy_across_assessment(
        studies=studies[:5],
        assessment=new_assessment,
        cw=cw,
        copy_rob=True
    )

    # copy viz  # TODO - make smarter
    visuals = summary_models.Visual.objects.filter(id__in=viz_ids)
    assert visuals.count() == len(viz_ids)
    for visual in visuals:
        visual.copy_across_assessments(cw)

    # copy data-pivots  # TODO - fix - some issue w/ the data-pivot not copying correctly.
    dpus = summary_models.DataPivotUpload.objects.filter(id__in=dp_ids)
    dpqs = summary_models.DataPivotQuery.objects.filter(id__in=dp_ids)
    import pdb; pdb.set_trace()
    assert dpus.count() + dpqs.count() == len(dp_ids)
    for dp in chain(dpus, dpqs):
        dp.copy_across_assessments(cw)

    with open(f'{new_assessment_name}.json', 'w') as f:
        json.dump(cw, f, indent=True)


def main():
    study_ids = [
        100000952, 100505515, 100000958, 100000945, 100502334, 100001478, 100001849, 100001631, 100512998, 100001064, 100001584, 100001983, 100000927, 100000979, 100000983, 100001578, 100001634, 100509475, 100000960, 100000939, 100001817, 100001027, 100001011, 100509477, 100000959, 100000926, 100001332, 100509474, 100001005, 100000950, 100001030, 100509478, 100001854, 100001848, 100509476, 100001329, 100001725, 100001045, 100001589, 100000920, 100510888, 100000951, 100513001, 100505514, 100001043, 100000956, 100000996, 100001333, 100001313, 100000957, 100001577, 100510697, 100001028, 100001815, 100000924, 100000893, 100512997, 100000921, 100001306, 100001311, 100001316, 100001314, 100001315, 100001317, 100001305, 100001312, 100001308, 100000942, 100000948, 100001334, 100001407, 100000985, 100001047, 100000932, 100001009, 100001821, 100001065, 100001008, 100000992, 100001325, 100000954, 100000999, 100001063, 100001003, 100001587, 100001826, 100001046, 100000925, 100000981, 100000974, 100001012, 100001825, 100000955, 100001014, 100001855, 100505513, 100001049, 100001822, 100510897, 100515434, 100000940, 100001337, 100001837, 100510623, 100001055, 100000941, 100001307, 100510696, 100510698, 100513034, 100513037, 100001026, 100000976, 100001864, 100000943, 100000978, 100001982, 100001965, 100000937, 100001336, 100505510, 100000949, 100001034, 100000990, 100001004, 100001827, 100001022, 100001780, 100001006, 100001327, 100000933, 100001580, 100001828, 100500023, 100000916, 100001778, 100001001, 100001324, 100001405, 100001797, 100505496, 100001630, 100000944, 100001984, 100001784, 100001323, 100001404, 100000963, 100001059, 100001039, 100001818, 100001048, 100001846, 100001023, 100001051, 100001070, 100001069, 100000995, 100000997, 100510699, 100001775, 100001050, 100001033, 100001054, 100000980, 100001000, 100510624, 100000998, 100001824, 100001632, 100001328, 100001037, 100001633, 100001779, 100509479, 100001776, 100510898, 100000988, 100001018, 100002018, 100001964, 100000935, 100000930, 100001032, 100001781, 100001773, 100001013, 100001067, 100505508, 100000915, 100000971, 100000923, 100001463, 100001017, 100000922, 100001457, 100001458, 100001459, 100001460, 100001461, 100001462, 100001061, 100000986, 100001335, 100000973, 100001052, 100001782, 100001585, 100505511, 100001814, 100001451, 100001320, 100001010, 100502337, 100000953, 100001774, 100000917, 100001036, 100001396, 100513038, 100001588, 100001044, 100001322, 100000946, 100001820, 100001851, 100512996, 100505518, 100505517, 100001835, 100001586, 100001066, 100000936, 100000987, 100001326, 100001836, 100001038, 100001040, 100001863, 100000975, 100000972, 100001318, 100000934, 100000993, 100001053, 100001029, 100001853, 100000938, 100001847, 100000928, 100001025, 100001819, 100001068, 100001024, 100001783, 100000977, 100001309, 100001041, 100000994, 100001581, 100510887, 100505516, 100505512, 100001060, 100001057, 100001056, 100001035, 100001058, 100001321, 100000947, 100001319, 100502336, 100510903, 100001310, 100001007, 100001002, 100001777, 100512999, 100000982, 100001410, 100001579, 100001852, 100001823, 100505509, 100509473, 100001582, 100000989, 100000991, 100001583, 100000966
    ]
    dp_ids = [
        100000087, 100000325, 100000266, 100500151, 100000308, 100000277, 100000090, 100500159, 100500086, 100500161, 100500150, 100500165, 100500164, 100500076, 100500078, 100500079, 100500073, 100500156, 100000295, 100500155, 100500162, 100500163, 100000299, 100000300, 100000298, 100000304, 100000301, 100000302, 100000303, 100500080, 100500084, 100500158, 100000293, 100500081, 100500077, 100500090, 100500160, 100000292, 100000297, 100000296, 100000294, 100500082, 100000285, 100000145, 100000167, 100500012, 100500061, 100500201, 100000343, 100000382, 100000383, 100000250, 100000251, 100500014, 100000278, 100000204, 100000197, 100000233, 100000275, 100500216, 100000283, 100500208, 100500011, 100500215, 100000280, 100000312, 100500060, 100500067, 100500008, 100000208, 100000201, 100500009, 100500020, 100500016, 100500217, 100500022, 100500034, 100000218, 100500131, 100000200, 100500059, 100000213, 100500033, 100000282, 100500039, 100500050, 100500049, 100500062, 100500038, 100500035, 100000318, 100000281, 100500013, 100500118, 100500203, 100500169, 100000265, 100500166, 100500227, 100500226, 100500228, 100000269, 100500193, 100500224, 100500225, 100500178, 100500177, 100500180, 100000257, 100500199, 100500200, 100500170, 100500171, 100500167, 100500198, 100000315, 100000261, 100500181, 100500189, 100000263, 100000264, 100000260, 100500223, 100500194, 100000270, 100500168, 100500192, 100000089, 100500202, 100000088, 100000259, 100500179, 100500214, 100000171, 100000262, 100000150, 100000328, 100000390, 100000152, 100000151, 100000258, 100500206, 100000344, 100000386, 100000387, 100500102, 100000243, 100000247, 100000242, 100500222, 100000246, 100000249, 100000244, 100000248, 100000273, 100000272, 100000268, 100000284, 100500070, 100500218, 100500098, 100500069, 100500149, 100500175, 100500221, 100500154, 100500101, 100500142, 100500141, 100500204, 100000342, 100000384, 100000385, 100000353, 100000234, 100000238, 100000112, 100000237, 100000236, 100000235, 100000239, 100000291, 100000379, 100000380, 100000368, 100000366, 100500117, 100000381, 100000371, 100500146
    ]
    viz_ids = [
        100000055, 100000063, 100000056, 100000067, 100000024, 100000084, 100000054, 100000062, 100000041, 100000042, 100000043, 100000044, 100000069, 100000102, 100000104, 100000106, 100000107, 100000110, 100000086, 100000078, 100000105, 100000089, 100000098, 100500049, 100000111, 100000112, 100500059, 100000108, 100500052, 100500054, 100500060, 100500061, 100500005, 100500066, 100500004, 100500010, 100500007, 100500030, 100500043, 100500032, 100500027, 100500028, 100500029, 100500031, 100000061, 100500070, 100500063, 100500067, 100500062, 100500069, 100500075, 100500074, 100500076, 100500077, 100500073, 100500079, 100500085, 100500051, 100500096, 100500095, 100500091, 100500094, 100500102, 100000064, 100500103, 100000060, 100500099, 100500104, 100500105
    ]
    clone_assessment(100000026, "tester", study_ids, dp_ids, viz_ids)


if __name__ == '__main__':
    main()

