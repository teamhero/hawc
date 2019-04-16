import json

from study.models import Study
from riskofbias.models import RiskOfBiasScore
from utils.helper import FlatFileExporter

from . import models

class OutcomeComplete(FlatFileExporter):

    def _get_header_row(self):
        header = []
        header.extend(Study.flat_complete_header_row())
        header.extend(models.StudyPopulation.flat_complete_header_row())
        header.extend(models.Outcome.flat_complete_header_row())
        header.extend(models.Exposure.flat_complete_header_row())
        header.extend(models.ComparisonSet.flat_complete_header_row())
        header.extend(models.Result.flat_complete_header_row())
        header.extend(models.Group.flat_complete_header_row())
        header.extend(models.GroupResult.flat_complete_header_row())
        return header

    def _get_data_rows(self):
        rows = []
        for obj in self.queryset:
            ser = obj.get_json(json_encode=False)
            row = []
            row.extend(Study.flat_complete_data_row(ser['study_population']['study']))
            row.extend(models.StudyPopulation.flat_complete_data_row(ser['study_population']))
            row.extend(models.Outcome.flat_complete_data_row(ser))
            for res in ser['results']:
                row_copy = list(row)
                row_copy.extend(models.Exposure.flat_complete_data_row(res["comparison_set"]["exposure"]))
                row_copy.extend(models.ComparisonSet.flat_complete_data_row(res["comparison_set"]))
                row_copy.extend(models.Result.flat_complete_data_row(res))
                for rg in res['results']:
                    row_copy2 = list(row_copy)
                    row_copy2.extend(models.Group.flat_complete_data_row(rg["group"]))
                    row_copy2.extend(models.GroupResult.flat_complete_data_row(rg))
                    rows.append(row_copy2)
        return rows


class OutcomeDataPivot(FlatFileExporter):

    def get_rob_headers(self):
        # grab a single study from this pivot and get the RoB visualization headers for it.
        for obj in self.queryset:
            assessment = obj.get_assessment()
            return assessment.get_rob_visualization_headers("epi")

    def _get_header_row(self):
        self.queryset = self.queryset.distinct('pk')
        
        headers = [
            'study id',
            'study name',
            'study identifier',
            'study published',

            'study population id',
            'study population name',
            'study population age profile',
            'study population source',
            'design',

            'outcome id',
            'outcome name',
            'outcome system',
            'outcome effect',
            'outcome effect subtype',
            'diagnostic',
            'age of outcome measurement',

            'tags',

            'comparison set id',
            'comparison set name',

            'exposure id',
            'exposure name',
            'exposure metric',
            'exposure measured',
            'dose units',
            'age of exposure',

            # central tendency fields - start
            'estimate type',
            'estimate',
            'variance type',
            'variance',
            'lower bound interval',
            'upper bound interval',
            'lower CI',
            'upper CI',
            'lower range',
            'upper range',
            # central tendency fields - end

            'result id',
            'result name',
            'result population description',
            'result tags',
            'statistical metric',
            'statistical metric abbreviation',
            'statistical metric description',
            'result summary',
            'dose response',
            'statistical power',
            'statistical test results',
            'CI units',

            'exposure group order',
            'exposure group name',
            'exposure group comparison name',
            'exposure group numeric',
            'Reference/Exposure group',
            'Result, summary numerical',

            'key',
            'result group id',
            'N',
            'group estimate',
            'group lower ci',
            'group upper ci',
            'group lower range',
            'group upper range',
            'group lower bound interval',
            'group upper bound interval',
            'group variance',
            'statistical significance',
            'statistical significance (numeric)',
            'main finding',
            'main finding support',
            'percent control mean',
            'percent control low',
            'percent control high',
            'Overall study confidence'
        ]
        headers.extend(self.get_rob_headers())
        return headers

    def _get_data_rows(self):
        rows = []
        for obj in self.queryset:
            ser = obj.get_json(json_encode=False)
            study_id = ser['study_population']['study']['id']

            study = Study.objects.get(pk=study_id)
            rob_data = study.get_final_rob_visualization_data("epi")
            finalROB = rob_data.overall_score
            robScores = rob_data.rob_scores

            row = [
                ser['study_population']['study']['id'],
                ser['study_population']['study']['short_citation'],
                ser['study_population']['study']['study_identifier'],
                ser['study_population']['study']['published'],

                ser['study_population']['id'],
                ser['study_population']['name'],
                ser['study_population']['age_profile'],
                ser['study_population']['source'],
                ser['study_population']['design'],

                ser['id'],
                ser['name'],
                ser['system'],
                ser['effect'],
                ser['effect_subtype'],
                ser['diagnostic'],
                ser['age_of_measurement'],

                self._get_tags(ser),
            ]
            for res in ser['results']:
                row_copy = list(row)

                # comparison set
                row_copy.extend([
                    res["comparison_set"]["id"],
                    res["comparison_set"]["name"],
                ])

                # exposure (may be missing)
                if res["comparison_set"]["exposure"]:
                    row_copy.extend([
                        res["comparison_set"]["exposure"]["id"],
                        res["comparison_set"]["exposure"]["name"],
                        res["comparison_set"]["exposure"]["metric"],
                        res["comparison_set"]["exposure"]["measured"],
                        res["comparison_set"]["exposure"]["metric_units"]["name"],
                        res["comparison_set"]["exposure"]["age_of_exposure"],
                    ])
                else:
                    row_copy.extend(['-'] * 6)

                # now that we have multiple central tendencies, need to clone rows for each CT -START
                rowsClonedForCT = 0
                if res["comparison_set"]["exposure"]:
                    cts = res["comparison_set"]["exposure"]["central_tendencies"]
                    for ct in cts:
                        row_copyCT = list(row_copy)
                        row_copyCT.extend([
                            ct["estimate_type"],
                            ct["estimate"],
                            ct["variance_type"],
                            ct["variance"],
                            ct["lower_bound_interval"],
                            ct["upper_bound_interval"],
                            ct["lower_ci"],
                            ct["upper_ci"],
                            ct["lower_range"],
                            ct["upper_range"],
                        ])
                        self.addOutcomesAndGroupsToRowAndAppend(rows, res, ser, finalROB, row_copyCT)
                        rowsClonedForCT += 1

                # if we had no ct's (should never happen) or no exposures, extend with dummy values
                if rowsClonedForCT == 0:
                    row_copy.extend(['-'] * 4)
                    self.addOutcomesAndGroupsToRowAndAppend(rows, res, ser, finalROB, row_copy)
                # clone rows for multiple central tendencies-END

                for rg in res['results']:
                    row_copy2 = list(row_copy)
                    row_copy2.extend([
                        rg['group']['group_id'],
                        rg['group']['name'],
                        rg['group']['comparative_name'],
                        rg['group']['numeric'],
                        ser['study_population']['study']['short_citation'] + ' (' + rg['group']['name'] + ', n=' + str(rg['n']) + ')',
                        str(rg['estimate']) + ' (' + str(rg['lower_ci']) + ' - ' + str(rg['upper_ci']) + ')',

                        rg['id'],
                        rg['id'],  # repeat for data-pivot key
                        rg['n'],
                        rg['estimate'],
                        rg['lower_ci'],
                        rg['upper_ci'],
                        rg['lower_range'],
                        rg['upper_range'],
                        rg['lower_bound_interval'],
                        rg['upper_bound_interval'],
                        rg['variance'],
                        rg['p_value_text'],
                        rg['p_value'],
                        rg['is_main_finding'],
                        rg['main_finding_support'],
                        rg['percentControlMean'],
                        rg['percentControlLow'],
                        rg['percentControlHigh'],
                    ])
                    row_copy2.append(finalROB)

                    row_copy2.extend(robScores)
 
                    rows.append(row_copy2)
        return rows

    def addOutcomesAndGroupsToRowAndAppend(self, rows, res, ser, finalROB, row):
        # outcome details
        row.extend([
            res['id'],
            res['name'],
            res['population_description'],
            self._get_tags(res),
            res['metric']['metric'],
            res['metric']['abbreviation'],
            res['metric_description'],
            res['comments'],
            res['dose_response'],
            res['statistical_power'],
            res['statistical_test_results'],
            res['ci_units'],
        ])

        for rg in res['results']:
            row_copy2 = list(row)
            row_copy2.extend([
                rg['group']['group_id'],
                rg['group']['name'],
                rg['group']['comparative_name'],
                rg['group']['numeric'],
                ser['study_population']['study']['short_citation'] + ' (' + rg['group']['name'] + ', n=' + str(rg['n']) + ')',
                str(rg['estimate']) + ' (' + str(rg['lower_ci']) + ' - ' + str(rg['upper_ci']) + ')',

                rg['id'],
                rg['id'],  # repeat for data-pivot key
                rg['n'],
                rg['estimate'],
                rg['lower_ci'],
                rg['upper_ci'],
                rg['lower_range'],
                rg['upper_range'],
                rg['lower_bound_interval'],
                rg['upper_bound_interval'],
                rg['variance'],
                rg['p_value_text'],
                rg['p_value'],
                rg['is_main_finding'],
                rg['main_finding_support'],
                rg['percentControlMean'],
                rg['percentControlLow'],
                rg['percentControlHigh'],
            ])
            row_copy2.append(finalROB)

            rows.append(row_copy2)
