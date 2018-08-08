from collections import OrderedDict
import json
import re

from django.core import serializers
from django.db.models import QuerySet
from crispy_forms import layout as cfl
from django import forms
from django.core.urlresolvers import reverse
import pandas as pd
from selectable import forms as selectable
from xlrd import XLRDError, open_workbook

from assessment.models import EffectTag, ConfidenceFactor, ConfidenceJudgement
from study.models import Study
from animal.models import Endpoint
from epi.models import Outcome
from invitro.models import IVEndpointCategory, IVChemical

from study.lookups import StudyLookup
from animal.lookups import EndpointByAssessmentLookup, EndpointByAssessmentLookupHtml
from utils.forms import BaseFormHelper

from . import models, lookups


def clean_slug(form):
    # ensure unique slug for assessment
    slug = form.cleaned_data.get("slug", None)
    if form.instance.__class__.objects\
           .filter(assessment_id=form.instance.assessment_id, slug=slug)\
           .exclude(id=form.instance.id)\
           .count() > 0:
        raise forms.ValidationError("URL name must be unique for this assessment.")
    return slug


class PrefilterMixin(object):
    PREFILTER_COMBO_FIELDS = [
        'studies',
        'systems', 'organs', 'effects', 'effect_subtypes',
        'episystems', 'epieffects',
        'iv_categories', 'iv_chemicals',
        'effect_tags',
    ]

    def createFields(self):
        fields = OrderedDict()

        if "study" in self.prefilter_include:
            fields.update([
                ("published_only", forms.BooleanField(
                    required=False,
                    initial=True,
                    label="Published studies only",
                    help_text='Only present data from studies which have been marked as '
                              '"published" in HAWC.')),
                ("prefilter_study", forms.BooleanField(
                    required=False,
                    label="Prefilter by study",
                    help_text="Prefilter endpoints to include only selected studies.")),
                ("studies", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Studies to include",
                    help_text="""Select one or more studies to include in the plot.
                                 If no study is selected, no endpoints will be available.""")),
            ])

        if "bioassay" in self.prefilter_include:
            fields.update([
                ("prefilter_system", forms.BooleanField(
                    required=False,
                    label="Prefilter by system",
                    help_text="Prefilter endpoints on plot to include selected systems.")),
                ("systems", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Systems to include",
                    help_text="""Select one or more systems to include in the plot.
                                 If no system is selected, no endpoints will be available.""")),
                ("prefilter_organ", forms.BooleanField(
                    required=False,
                    label="Prefilter by organ",
                    help_text="Prefilter endpoints on plot to include selected organs.")),
                ("organs", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Organs to include",
                    help_text="""Select one or more organs to include in the plot.
                                 If no organ is selected, no endpoints will be available.""")),
                ("prefilter_effect", forms.BooleanField(
                    required=False,
                    label="Prefilter by effect",
                    help_text="Prefilter endpoints on plot to include selected effects.")),
                ("effects", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Effects to include",
                    help_text="""Select one or more effects to include in the plot.
                                 If no effect is selected, no endpoints will be available.""")),
                ("prefilter_effect_subtype", forms.BooleanField(
                    required=False,
                    label="Prefilter by effect sub-type",
                    help_text="Prefilter endpoints on plot to include selected effects.")),
                ("effect_subtypes", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Effect Sub-Types to include",
                    help_text="""Select one or more effect sub-types to include in the plot.
                                 If no effect sub-type is selected, no endpoints will be available.""")),
            ])

        if "epi" in self.prefilter_include:
            fields.update([
                ("prefilter_episystem", forms.BooleanField(
                    required=False,
                    label="Prefilter by system",
                    help_text="Prefilter endpoints on plot to include selected systems.")),
                ("episystems", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Systems to include",
                    help_text="""Select one or more systems to include in the plot.
                                 If no system is selected, no endpoints will be available.""")),
                ("prefilter_epieffect", forms.BooleanField(
                    required=False,
                    label="Prefilter by effect",
                    help_text="Prefilter endpoints on plot to include selected effects.")),
                ("epieffects", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Effects to include",
                    help_text="""Select one or more effects to include in the plot.
                                 If no effect is selected, no endpoints will be available.""")),
            ])

        if "invitro" in self.prefilter_include:
            fields.update([
                ("prefilter_iv_category", forms.BooleanField(
                    required=False,
                    label="Prefilter by category",
                    help_text="Prefilter endpoints to include only selected category.")),
                ("iv_categories", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Categories to include",
                    help_text="""Select one or more categories to include in the plot.
                                 If no study is selected, no endpoints will be available.""")),
                ("prefilter_iv_chemical", forms.BooleanField(
                    required=False,
                    label="Prefilter by chemical",
                    help_text="Prefilter endpoints to include only selected chemicals.")),
                ("iv_chemicals", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Chemicals to include",
                    help_text="""Select one or more chemicals to include in the plot.
                                 If no study is selected, no endpoints will be available.""")),
            ])

        if "effect_tags" in self.prefilter_include:
            fields.update([
                ("prefilter_effect_tag", forms.BooleanField(
                    required=False,
                    label="Prefilter by effect-tag",
                    help_text="Prefilter endpoints to include only selected effect-tags.")),
                ("effect_tags", forms.MultipleChoiceField(
                    required=False,
                    widget=forms.SelectMultiple,
                    label="Tags to include",
                    help_text="""Select one or more effect-tags to include in the plot.
                                 If no study is selected, no endpoints will be available.""")),
            ])

        for k, v in fields.items():
            self.fields[k] = v

    def setInitialValues(self):

        is_new = self.instance.id is None
        try:
            prefilters = json.loads(self.initial.get('prefilters', '{}'))
        except ValueError:
            prefilters = {}

        if type(self.instance) is models.Visual:
            evidence_type = models.BIOASSAY
        else:
            evidence_type = self.initial.get('evidence_type') or \
                self.instance.evidence_type

        for k, v in prefilters.items():
            if k == "system__in":
                if evidence_type == models.BIOASSAY:
                    self.fields["prefilter_system"].initial = True
                    self.fields["systems"].initial = v
                elif evidence_type == models.EPI:
                    self.fields["prefilter_episystem"].initial = True
                    self.fields["episystems"].initial = v

            if k == "organ__in":
                self.fields["prefilter_organ"].initial = True
                self.fields["organs"].initial = v

            if k == "effect__in":
                if evidence_type == models.BIOASSAY:
                    self.fields["prefilter_effect"].initial = True
                    self.fields["effects"].initial = v
                elif evidence_type == models.EPI:
                    self.fields["prefilter_epieffect"].initial = True
                    self.fields["epieffects"].initial = v

            if k == "effect_subtype__in":
                self.fields["prefilter_effect_subtype"].initial = True
                self.fields["effect_subtypes"].initial = v

            if k == "effects__in":
                self.fields["prefilter_effect_tag"].initial = True
                self.fields["effect_tags"].initial = v

            if k == "category__in":
                self.fields["prefilter_iv_category"].initial = True
                self.fields["iv_categories"].initial = v

            if k == "chemical__name__in":
                self.fields["prefilter_iv_chemical"].initial = True
                self.fields["iv_chemicals"].initial = v

            if k in [
                    "animal_group__experiment__study__in",
                    "study_population__study__in",
                    "experiment__study__in",
                    "protocol__study__in",
                    ]:
                self.fields["prefilter_study"].initial = True
                self.fields["studies"].initial = v

        if self.__class__.__name__ == "CrossviewForm":
            published_only = prefilters.get("animal_group__experiment__study__published", False)
            if is_new:
                published_only = True
            self.fields["published_only"].initial = published_only

        for fldname in self.PREFILTER_COMBO_FIELDS:
            field = self.fields.get(fldname)
            if field:
                field.choices = self.getPrefilterQueryset(fldname)

    def getPrefilterQueryset(self, field_name):
        assessment_id = self.instance.assessment_id
        choices = None

        if field_name == "systems":
            choices = Endpoint.objects.get_system_choices(assessment_id)
        elif field_name == "organs":
            choices = Endpoint.objects.get_organ_choices(assessment_id)
        elif field_name == "effects":
            choices = Endpoint.objects.get_effect_choices(assessment_id)
        elif field_name == "effect_subtypes":
            choices = Endpoint.objects.get_effect_subtype_choices(assessment_id)
        elif field_name == "iv_categories":
            choices = IVEndpointCategory.get_choices(assessment_id)
        elif field_name == "iv_chemicals":
            choices = IVChemical.objects.get_choices(assessment_id)
        elif field_name == "effect_tags":
            choices = EffectTag.objects.get_choices(assessment_id)
        elif field_name == "studies":
            choices = Study.objects.get_choices(assessment_id)
        elif field_name == "episystems":
            choices = Outcome.objects.get_system_choices(assessment_id)
        elif field_name == "epieffects":
            choices = Outcome.objects.get_effect_choices(assessment_id)
        else:
            raise ValueError("Unknown field name: {}".format(field_name))

        return choices

    def setFieldStyles(self):
        if self.fields.get('prefilters'):
            self.fields["prefilters"].widget = forms.HiddenInput()

        for fldname in self.PREFILTER_COMBO_FIELDS:
            field = self.fields.get(fldname)
            if field:
                field.widget.attrs['size'] = 10

    def setPrefilters(self, data):
        prefilters = {}

        if data.get('prefilter_study') is True:
            studies = data.get("studies", [])

            evidence_type = data.get('evidence_type', None)
            if self.__class__.__name__ == "CrossviewForm":
                evidence_type = 0

            if evidence_type == models.BIOASSAY:
                prefilters["animal_group__experiment__study__in"] = studies
            elif evidence_type == models.IN_VITRO:
                prefilters["experiment__study__in"] = studies
            elif evidence_type == models.EPI:
                prefilters["study_population__study__in"] = studies
            elif evidence_type == models.EPI_META:
                prefilters["protocol__study__in"] = studies
            else:
                raise ValueError("Unknown evidence type")

        if data.get('prefilter_system') is True:
            prefilters["system__in"] = data.get("systems", [])

        if data.get('prefilter_organ') is True:
            prefilters["organ__in"] = data.get("organs", [])

        if data.get('prefilter_effect') is True:
            prefilters["effect__in"] = data.get("effects", [])

        if data.get('prefilter_effect_subtype') is True:
            prefilters["effect_subtype__in"] = data.get("effect_subtypes", [])

        if data.get('prefilter_episystem') is True:
            prefilters["system__in"] = data.get("episystems", [])

        if data.get('prefilter_epieffect') is True:
            prefilters["effect__in"] = data.get("epieffects", [])

        if data.get('prefilter_iv_category') is True:
            prefilters["category__in"] = data.get("iv_categories", [])

        if data.get('prefilter_iv_chemical') is True:
            prefilters["chemical__name__in"] = data.get("iv_chemicals", [])

        if data.get('prefilter_effect_tag') is True:
            prefilters["effects__in"] = data.get("effect_tags", [])

        if self.__class__.__name__ == "CrossviewForm" and \
           data.get('published_only') is True:
            prefilters["animal_group__experiment__study__published"] = True

        return json.dumps(prefilters)

    def clean(self):
        cleaned_data = super().clean()
        cleaned_data["prefilters"] = self.setPrefilters(cleaned_data)
        return cleaned_data

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.createFields()
        self.setInitialValues()
        self.setFieldStyles()


class SummaryTextForm(forms.ModelForm):

    parent = forms.ModelChoiceField(
        queryset=models.SummaryText.objects.all(),
        required=False)
    sibling = forms.ModelChoiceField(
        label="Insert After",
        queryset=models.SummaryText.objects.all(),
        required=False)

    class Meta:
        model = models.SummaryText
        fields = ('title', 'slug', 'text', )

    def __init__(self, *args, **kwargs):
        assessment = kwargs.pop('parent', None)
        super().__init__(*args, **kwargs)
        if assessment:
            self.instance.assessment = assessment
        qs = models.SummaryText.get_assessment_qs(self.instance.assessment.id)
        self.fields['parent'].queryset = qs
        self.fields['sibling'].queryset = qs
        self.helper = self.setHelper()

    def clean_parent(self):
        parent = self.cleaned_data.get('parent')
        if parent is not None and parent.assessment != self.instance.assessment:
            err = "Parent must be from the same assessment"
            raise forms.ValidationError(err)
        return parent

    def clean_sibling(self):
        sibling = self.cleaned_data.get('sibling')
        if sibling is not None and sibling.assessment != self.instance.assessment:
            err = "Sibling must be from the same assessment"
            raise forms.ValidationError(err)
        return sibling

    def clean_title(self):
        title = self.cleaned_data['title']
        pk_exclusion = {'id': self.instance.id or -1}
        if models.SummaryText.objects\
                .filter(assessment=self.instance.assessment, title=title)\
                .exclude(**pk_exclusion).count() > 0:
                    err = "Title must be unique for assessment."
                    raise forms.ValidationError(err)
        return title

    def clean_slug(self):
        slug = self.cleaned_data['slug']
        pk_exclusion = {'id': self.instance.id or -1}
        if models.SummaryText.objects\
                .filter(assessment=self.instance.assessment, slug=slug)\
                .exclude(**pk_exclusion).count() > 0:
                    err = "Title must be unique for assessment."
                    raise forms.ValidationError(err)
        return slug

    def setHelper(self):

        for fld in list(self.fields.keys()):
            widget = self.fields[fld].widget
            if type(widget) != forms.CheckboxInput:
                widget.attrs['class'] = 'span12'

        inputs = {
            "form_actions": [
                cfl.Submit('save', 'Save'),
                cfl.HTML('<a class="btn btn-danger" id="deleteSTBtn" href="#deleteST" data-toggle="modal">Delete</a>'),
                cfl.HTML('<a class="btn" href="{0}" >Cancel</a>'.format(
                    reverse("summary:list", kwargs={'pk': self.instance.assessment.id}))),
            ]
        }
        helper = BaseFormHelper(self, **inputs)
        helper.form_class = None
        return helper


class VisualForm(forms.ModelForm):

    class Meta:
        model = models.Visual
        exclude = ('assessment', 'visual_type', 'prefilters')

    def __init__(self, *args, **kwargs):
        assessment = kwargs.pop('parent', None)
        visual_type = kwargs.pop('visual_type', None)
        super().__init__(*args, **kwargs)
        self.fields['settings'].widget.attrs['rows'] = 2
        if assessment:
            self.instance.assessment = assessment
        if visual_type is not None:  # required if value is 0
            self.instance.visual_type = visual_type
        if self.instance.visual_type != 2:
            self.fields['sort_order'].widget = forms.HiddenInput()
			
    def setHelper(self):

        for fld in list(self.fields.keys()):
            widget = self.fields[fld].widget
            if type(widget) != forms.CheckboxInput:
                widget.attrs['class'] = 'span12'

        if self.instance.id:
            inputs = {
                "legend_text": "Update {}".format(self.instance),
                "help_text":   "Update an existing visualization.",
                "cancel_url": self.instance.get_absolute_url()
            }
        else:
            inputs = {
                "legend_text": "Create new visualization",
                "help_text":   """
                    Create a custom-visualization.
                    Generally, you will select a subset of available data on the
                    "Data" tab, then will customize the visualization using the
                    "Settings" tab. To view a preview of the visual at any time,
                    select the "Preview" tab.
                """,
                "cancel_url": self.instance.get_list_url(self.instance.assessment.id)
            }

        helper = BaseFormHelper(self, **inputs)
        helper.form_class = None
        helper.form_id = "visualForm"
        return helper

    def clean_slug(self):
        return clean_slug(self)


class EndpointAggregationSelectMultipleWidget(selectable.AutoCompleteSelectMultipleWidget):
    """
    Value in render is a queryset of type assessment.models.BaseEndpoint,
    where the widget is expecting type animal.models.Endpoint. Therefore, the
    value is written as a string instead of ID when using the standard widget.
    We override to return the proper type for the queryset so the widget
    properly returns IDs instead of strings.
    """

    def render(self, name, value, attrs=None):
        if value:
            value = [value.id for value in value]
        return super(selectable.AutoCompleteSelectMultipleWidget, self).render(name, value, attrs)


class EndpointAggregationForm(VisualForm):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["endpoints"] = selectable.AutoCompleteSelectMultipleField(
            lookup_class=EndpointByAssessmentLookupHtml,
            label='Endpoints',
            widget=EndpointAggregationSelectMultipleWidget)
        self.fields["endpoints"].widget.update_query_parameters(
            {'related': self.instance.assessment_id})
        self.helper = self.setHelper()
        self.helper.attrs['novalidate'] = ''

    class Meta:
        model = models.Visual
        exclude = ('assessment', 'visual_type', 'prefilters', 'studies')


class CrossviewForm(PrefilterMixin, VisualForm):
    prefilter_include = ('study', 'bioassay', 'effect_tags')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = self.setHelper()

    class Meta:
        model = models.Visual
        exclude = ('assessment', 'visual_type', 'endpoints', 'studies')


class RoBForm(PrefilterMixin, VisualForm):

    prefilter_include = ('bioassay', )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["studies"].queryset = \
            self.fields["studies"]\
                .queryset\
                .filter(assessment=self.instance.assessment)
        self.helper = self.setHelper()

    class Meta:
        model = models.Visual
        exclude = ('assessment', 'visual_type', 'dose_units', 'endpoints')


def get_visual_form(visual_type):
    try:
        return {
            models.Visual.BIOASSAY_AGGREGATION: EndpointAggregationForm,
            models.Visual.BIOASSAY_CROSSVIEW: CrossviewForm,
            models.Visual.ROB_HEATMAP: RoBForm,
            models.Visual.ROB_BARCHART: RoBForm,
        }[visual_type]
    except:
        raise ValueError()


class DataPivotForm(forms.ModelForm):

    def __init__(self, *args, **kwargs):
        assessment = kwargs.pop('parent', None)
        super().__init__(*args, **kwargs)
        if assessment:
            self.instance.assessment = assessment
        self.helper = self.setHelper()
        self.fields['settings'].widget.attrs['rows'] = 2

    def setHelper(self):

        for fld in list(self.fields.keys()):
            widget = self.fields[fld].widget
            if type(widget) != forms.CheckboxInput:
                widget.attrs['class'] = 'span12'

        if self.instance.id:
            inputs = {
                "legend_text": "Update {}".format(self.instance),
                "help_text":   "Update an existing data-pivot.",
                "cancel_url": self.instance.get_absolute_url()
            }
        else:
            inputs = {
                "legend_text": "Create new data-pivot",
                "help_text":   """
                    Create a custom-visualization for this assessment.
                    Generally, you will select a subset of available data, then
                    customize the visualization the next-page.
                """,
                "cancel_url": self.instance.get_list_url(self.instance.assessment.id)
            }

        helper = BaseFormHelper(self, **inputs)
        helper.form_class = None
        helper.form_id = "dataPivotForm"
        return helper

    def clean_slug(self):
        return clean_slug(self)


class DataPivotUploadForm(DataPivotForm):

    class Meta:
        model = models.DataPivotUpload
        exclude = ('assessment', )

    def clean(self):
        cleaned_data = super().clean()
        excel_file = cleaned_data.get('excel_file')
        worksheet_name = cleaned_data.get('worksheet_name', '')
        if worksheet_name == '':
            worksheet_name = 0

        if excel_file:
            # see if it loads
            try:
                worksheet_names = open_workbook(file_contents=excel_file.read()).sheet_names()
            except XLRDError:
                self.add_error("excel_file", "Unable to read Excel file. Please upload an Excel file in XLSX format.")
                return

            # check worksheet name
            if worksheet_name:
                if worksheet_name not in worksheet_names:
                    self.add_error('worksheet_name', f"Worksheet name {worksheet_name} not found.")
                    return

            df = pd.read_excel(excel_file, sheet_name=worksheet_name)

            # check data
            if df.shape[0] < 2:
                self.add_error("excel_file", "Must contain at least 2 rows of data.")

            if df.shape[1] < 2:
                self.add_error("excel_file", "Must contain at least 2 columns.")


class DataPivotQueryForm(PrefilterMixin, DataPivotForm):

    prefilter_include = ('study', 'bioassay', 'epi', 'invitro', 'effect_tags')

    class Meta:
        model = models.DataPivotQuery
        fields = ('evidence_type', 'export_style', 'title', 'preferred_units',
                  'slug', 'settings', 'caption', 'published',
                  'published_only', 'prefilters')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["evidence_type"].choices = (
            (models.BIOASSAY, 'Animal Bioassay'),
            (models.EPI, 'Epidemiology'),
            (models.EPI_META, 'Epidemiology meta-analysis/pooled analysis'),
            (models.IN_VITRO, 'In vitro'))
        self.fields['preferred_units'].required = False
        self.helper = self.setHelper()

    def save(self, commit=True):
        self.instance.preferred_units = self.cleaned_data.get('preferred_units', [])
        return super().save(commit=commit)

    def clean_export_style(self):
        evidence_type = self.cleaned_data['evidence_type']
        export_style = self.cleaned_data['export_style']
        if evidence_type not in (models.IN_VITRO, models.BIOASSAY) and export_style != self.instance.EXPORT_GROUP:
            raise forms.ValidationError("Outcome/Result level export not implemented for this data-type.")
        return export_style


class DataPivotSettingsForm(forms.ModelForm):

    class Meta:
        model = models.DataPivot
        fields = ('settings', )


class DataPivotModelChoiceField(forms.ModelChoiceField):

    def label_from_instance(self, obj):
        return "{}: {}".format(obj.assessment, obj)


class DataPivotSelectorForm(forms.Form):

    dp = DataPivotModelChoiceField(
        label="Data Pivot",
        queryset=models.DataPivot.objects.all(),
        empty_label=None)

    reset_row_overrides = forms.BooleanField(
        help_text='Reset all row-level customization in the data-pivot copy',
        required=False,
        initial=True)

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user')
        super().__init__(*args, **kwargs)

        for fld in list(self.fields.keys()):
            self.fields[fld].widget.attrs['class'] = 'span12'

        self.fields['dp'].queryset = models.DataPivot.objects\
            .clonable_queryset(user)


class SmartTagForm(forms.Form):
    RESOURCE_CHOICES = (
        ('study', 'Study'),
        ('endpoint', 'Endpoint'),
        ('visual', 'Visualization'),
        ('data_pivot', 'Data Pivot'),
    )
    resource = forms.ChoiceField(
        choices=RESOURCE_CHOICES)
    study = selectable.AutoCompleteSelectField(
        lookup_class=StudyLookup,
        help_text="Type a few characters of the study name, then click to select.")
    endpoint = selectable.AutoCompleteSelectField(
        lookup_class=EndpointByAssessmentLookup,
        help_text="Type a few characters of the endpoint name, then click to select.")
    visual = selectable.AutoCompleteSelectField(
        lookup_class=lookups.VisualLookup,
        help_text="Type a few characters of the visual name, then click to select.")
    data_pivot = selectable.AutoCompleteSelectField(
        lookup_class=lookups.DataPivotLookup,
        help_text="Type a few characters of the data-pivot name, then click to select.")

    def __init__(self, *args, **kwargs):
        assessment_id = kwargs.pop('assessment_id', -1)
        super().__init__(*args, **kwargs)
        for fld in list(self.fields.keys()):
            widget = self.fields[fld].widget
            widget.attrs['class'] = 'span12'
            if hasattr(widget, 'update_query_parameters'):
                widget.update_query_parameters({'related': assessment_id})
                widget.attrs['class'] += " smartTagSearch"


# This class is the form used for adding/editing an Evidence Profile object
class EvidenceProfileForm(forms.ModelForm):
    submitted_data = None

    class Meta:
        # Set the base model and form fields for this form
        model = models.EvidenceProfile
        fields = ("title", "slug", "caption", "one_scenario_per_stream")

    # This is the initialization method for this form object
    def __init__(self, *args, **kwargs):
        # Before doing anything else, get an un=modified copy of the incoming submitted data for use later
        self.submitted_data = kwargs.get("data", None)

        # Attempt to get a reference to this object's parent Assessment object, and then run the superclass's initialization method
        assessment = kwargs.pop("parent", None)
        super().__init__(*args, **kwargs)

        if (assessment):
            # A parent Assessment object was found, copy a reference to it into this object's instance
            self.instance.assessment = assessment

        # Get the initial values for the fields related to cross-stream confidence judgements
        initial_confidence_judgement = {}
        try:
            initial_confidence_judgement = json.loads(self.instance.cross_stream_confidence_judgement)
        except:
            pass

        # Create a list of confidence judgement options from the appropriate lookup table
        confidenceJudgementChoices = [(confidenceJudgement.value, confidenceJudgement.name) for confidenceJudgement in ConfidenceJudgement.objects.all().order_by("value")]
        confidenceJudgementChoices.insert(0, ("", "Select Judgement"))

        # Create an ordered dictionary of new fields that will be added to the form
        new_fields = OrderedDict()
        new_fields.update(
            [
                (
                    "confidence_judgement_score",
                    forms.ChoiceField(
                        required = False,
                        label = "Total Judgement Score Across All Streams",
                        choices = confidenceJudgementChoices,
                        initial = initial_confidence_judgement["score"] if ("score" in initial_confidence_judgement) else "",
                        widget = forms.Select(
                            attrs={
                                "style": "width:175px;"
                            }
                        ),
                    ),
                ),
                (
                    "confidence_judgement_title",
                    forms.CharField(
                        required = True,
                        label = "Title/Short Explanation",
                        initial = initial_confidence_judgement["title"] if ("title" in initial_confidence_judgement) else "",
                        widget = forms.TextInput(),
                    ),
                ),
                (
                    "confidence_judgement_explanation",
                    forms.CharField(
                        required = False,
                        label = "Full Explanation",
                        initial = initial_confidence_judgement["explanation"] if ("explanation" in initial_confidence_judgement) else "",
                        help_text = "Explain why you selected the overall judgement score you did",
                        widget = forms.Textarea(),
                    ),
                ),
            ]
        )

        # Iterate through the new set of fields and add them to self.fields
        for key, value in new_fields.items():
            self.fields[key] = value

        self.fields["one_scenario_per_stream"].widget.attrs["onclick"] = "onlyOneScenarioPerStream(this)"

        # Set the desired helper classes, etc. for this form
        self.helper = self.setHelper()

    # This method attempts to set the desired helper widgets for the form fields
    def setHelper(self):
        # Iterate through the set of form fields and look for those that do not use the forms.CheckboxInput widget
        for fieldName in list(self.fields.keys()):
            widget = self.fields[fieldName].widget
            if (type(widget) != forms.CheckboxInput):
                # This form field does not use the forms.CheckboxInput widget, add the 'span12' class to its widget
                widget.attrs['class'] = 'span12'

        if (self.instance.id):
            # This is an existing evidence profile that is being edited, set inputs accordingly
            inputs = {
                "legend_text": "Update {}".format(self.instance),
                "help_text":   "Update an existing evidence profile.",
                "cancel_url": self.instance.get_absolute_url()
            }
        else:
            # This is a new evidence profile that is being created, sete inputs accordingly
            inputs = {
                "legend_text": "Create new evidence profile",
                "help_text":   "Create an evidence profile for this assessment.",
                "cancel_url": self.instance.get_list_url(self.instance.assessment.id)
            }

        # Set the basic helper attributes fron the 'inputs' object just created, and then set some specialized ones for this class
        helper = BaseFormHelper(self, **inputs)
        helper.form_class = None
        helper.form_id = "evidenceProfileForm"

        return helper

    # This method makes sure that the Evidence Profile's "slug" attribute is valid and URL-friendly
    def clean_slug(self):
        return clean_slug(self)

    # This method overrides the super-class's clean() method
    def clean(self):
        # First, use the super-class's clean() method as a starting point
        cleaned_data = super().clean()

        # These objects will be used frequently, so go ahead and create:
        #   * A list of valid confidence judgement values for validating submitted form data
        #   * A dictionary mapping of confidence judgement values to names for use when building the final objects that will be saved as part of cleaned_data
        confidence_judgement_value_list = []
        confidence_judgement_dict = {}
        for confidenceJudgement in ConfidenceJudgement.objects.all().order_by("value"):
            confidence_judgement_value_list.append(confidenceJudgement.value)
            confidence_judgement_dict[confidenceJudgement.value] = confidenceJudgement.name

        # Initialize a dict to hold objects made up of related sets of form data, along with information about their form field naming conventions
        # This object will be used as a temporary store to be built up while iterating over the incoming form key/value pairs; and then ordering of
        # the objects will be done after they have all been built
        unordered_types = {
            "cross_stream_inferences": {
                "ordering_field": "order",
                "retain_ordering_field": False,
                "re_match": r"^inference_(\d+)_(title|description|order)$",
                "re_replace_with": r"\1,\2",
                "field_validation": {
                    "title": {
                        "required": True,
                        "type": "string",
                        "can_be_empty": False,
                    },
                    "description": {
                        "required": True,
                        "type": "string",
                        "can_be_empty": True,
                    },
                },
            },
            "evidence_profile_streams": {
                "ordering_field": "order",
                "retain_ordering_field": True,
                "re_match": r"^stream_(\d+)_(pk|stream_type|stream_title|confidence_judgement_title|confidence_judgement_score|confidence_judgement_explanation|summary_of_findings_title|summary_of_findings_summary|order)$",
                "re_replace_with": r"\1,\2",
                "field_validation": {
                    "pk": {
                        "required": False,
                        "type": "integer",
                        "can_be_empty": True,
                    },
                    "stream_type": {
                        "required": True,
                        "type": "integer",
                        "valid_options": [stream_type["value"] for stream_type in models.get_serialized_stream_types()],
                        "can_be_empty": False,
                    },
                    "stream_title": {
                        "required": True,
                        "type": "string",
                        "can_be_empty": False,
                    },
                    "confidence_judgement_title": {
                        "required": True,
                        "type": "string",
                        "can_be_empty": False,
                    },
                    "confidence_judgement_score": {
                        "required": True,
                        "type": "integer",
                        "valid_options": confidence_judgement_value_list,
                        "can_be_empty": False,
                    },
                    "confidence_judgement_explanation": {
                        "required": True,
                        "type": "string",
                        "can_be_empty": True,
                    },
                    "summary_of_findings_title": {
                        "required": False,
                        "type": "string",
                        "can_be_empty": True,
                    },
                    "summary_of_findings_summary": {
                        "required": False,
                        "type": "strng",
                        "can_be_empty": True,
                    }
                },
            },
            "stream_scenarios": {
                "parent_object_type": "evidence_profile_streams",
                "parent_field": "scenarios",
                "ordering_field": "order",
                "retain_ordering_field": True,
                "re_match": r"^stream_(\d+)_(\d+)_scenario_(order|pk|scenario_name|outcome_score|outcome_title|outcome_explanation|summary_of_findings_title|summary_of_findings_summary)$",
                "re_replace_with": r"\1,\2,\3",
                "field_validation": {
                    "pk": {
                        "required": False,
                        "type": "integer",
                        "can_be_empty": True,
                    },
                     "outcome": {
                        "required": True,
                        "type": "string",
                        "can_be_empty": True,
                    },
                     "outcome_title": {
                        "required": True,
                        "type": "string",
                        "can_be_empty": True,
                    },
                    "outcome_title": {
                        "required": True,
                        "type": "string",
                        "can_be_empty": False,
                    },
                    "outcome_score": {
                        "required": False,
                        "type": "integer",
                        "can_be_empty": True,
                    },
                    "outcome_explanation": {
                        "required": True,
                        "type": "string",
                        "can_be_empty": True,
                    },
                    "summary_of_findings_title": {
                        "required": False,
                        "type": "string",
                        "can_be_empty": True,
                    },
                    "summary_of_findings_summary": {
                        "required": False,
                        "type": "strng",
                        "can_be_empty": True,
                    }
                },
            },
            "effect_tags": {
                "parent_object_type": "stream_scenarios",
                "parent_field": "effectTags",
                "ordering_field": "order",
                "retain_ordering_field": True,
                "re_match": r"^stream_(\d+)_(\d+)_(\d+)_effectTag_(order|pk)$",
                "re_replace_with": r"\1,\2,\3,\4",
                "field_validation": {
                    "pk": {
                        "required": True,
                        "type": "integer",
                        "can_be_empty": False,
                    },
                },
            },
            "studies": {
                "parent_object_type": "effect_tags",
                "parent_field": "studies",
                "ordering_field": "order",
                "retain_ordering_field": True,
                "re_match": r"^stream_(\d+)_(\d+)_(\d+)_(\d+)_study_(order|pk)$",
                "re_replace_with": r"\1,\2,\3,\4,\5",
                "field_validation": {
                    "pk": {
                        "required": True,
                        "type": "integer",
                        "can_be_empty": False,
                    },
                },
            },
            "confidenceFactorsIncrease": {
                "parent_object_type": "stream_scenarios",
                "parent_field": "confidenceFactorsIncrease",
                "ordering_field": "order",
                "retain_ordering_field": True,
                "re_match": r"^stream_(\d+)_(\d+)_increase_(\d+)_confidenceFactor_(order|pk|explanation)$",
                "re_replace_with": r"\1,\2,\3,\4",
                "field_validation": {
                    "pk": {
                        "required": True,
                        "type": "integer",
                        "can_be_empty": False,
                    },
                },
            },
            "confidenceFactorsDecrease": {
                "parent_object_type": "stream_scenarios",
                "parent_field": "confidenceFactorsDecrease",
                "ordering_field": "order",
                "retain_ordering_field": True,
                "re_match": r"^stream_(\d+)_(\d+)_decrease_(\d+)_confidenceFactor_(order|pk|explanation)$",
                "re_replace_with": r"\1,\2,\3,\4",
                "field_validation": {
                    "pk": {
                        "required": True,
                        "type": "integer",
                        "can_be_empty": False,
                    },
                },
            }
        }

        #Iterate over the sets of unordered object types and add some key/value attributes to each one that are common to all
        for ut_key, ut_dict in unordered_types.items():
            # "objects" is a dictionary to hold the individual objects as they are built up from individual form fields
            ut_dict["objects"] = {}

            # "type_lineage" is a list tracing this object type's parentage all the way to the top level
            # One object type can be a child of another object type
            # THESE RELATIONSHIPS CAN BE ARBITRARILY DEEP! (3 levels deep for now, but that could change)
            # Build up a list for the full lineage of object types; starting out by checking this object type's key
            ut_dict["type_lineage"] = []
            check_key = ut_key
            while (("parent_object_type" in unordered_types[check_key]) and (unordered_types[check_key]["parent_object_type"] in unordered_types)):
                # This type has a parent type, add the key being checked to typeLineage and get the parent's key to check in the
                # next iteration through this loop
                ut_dict["type_lineage"].insert(0, check_key)
                check_key = unordered_types[check_key]["parent_object_type"]

            # Add the final object type key that was checked to typeLineage (the final check_key value will not be in typeLineage yet because
            # it didn't have a parent type)
            ut_dict["type_lineage"].insert(0, check_key)

            if (len(ut_dict["type_lineage"]) == 1):
                # "desired_order" is a list to hold the same objects as the "objects" dictionary, but in the desired order
                # This field is only needed for top-level object types (i.e. those with only themselves in their type_lineage list)
                ut_dict["desired_order"] = []

        # Iterate over the submitted form fields to build the various unordered objects that will be added to the sets of objects initialized above
        for form_key, form_value in self.submitted_data.items():

            # Iterate over the sets of unordered object types to check and see if this form field belongs in one of them
            for ut_key, ut_dict in unordered_types.items():
                if (re.search(ut_dict["re_match"], form_key)):
                    # This form field's name matched the naming convention corresponding to this type of unordered object; attempt to add it to
                    # this dictionary's object attribute

                    # Perform the regular expression substitution to retrieve the relevant parts of the field name
                    fieldNameDetails = re.sub(ut_dict["re_match"], ut_dict["re_replace_with"], form_key).split(",")

                    if ((len(ut_dict["type_lineage"]) + 1) == len(fieldNameDetails)):
                        # The number of elements in the details extracted from the incoming form field's name coresonds to the object type's expected
                        # lineage, continue
                        # Iterate over most of fieldNameDetails and convert all but the final element to an integer
                        i = 0
                        detailsOk = True
                        iTo = len(fieldNameDetails) - 1
                        while ((i < iTo) and (detailsOk)):
                            try:
                                # Perform the integer conversion within a try block in case it isn't a valid integer
                                fieldNameDetails[i] = int(fieldNameDetails[i])

                                if (fieldNameDetails[i] <= 0):
                                    # The element's value is an integer, but not a positive one, flip detailsOk flag to False
                                    detailsOk = False
                            except:
                                # This element was not a valid integer, flip the detailsOk flag to False
                                detailsOk = False

                            # Increment i
                            i = i + 1

                        if (detailsOk):
                            # All of the elements in fieldNameDetails that should be integers are integers, continue

                            # Get the key for placing this data field within this object type's "object" attribute and get the field name
                            object_key = "_".join([str(detail) for detail in fieldNameDetails if (isinstance(detail, int))])
                            field_name = fieldNameDetails[len(fieldNameDetails) - 1]

                            if (object_key not in ut_dict["objects"]):
                                # Thie object has not yet been initialized in the objects attributes, initialize it now as an empty dictionary
                                ut_dict["objects"][object_key] = {}

                            # Add this form field's value to this object in the objects attribute
                            ut_dict["objects"][object_key][field_name] = self.submitted_data[form_key]

        # Now iterate through each of the different types of unordered objects to validate the objects that have been built up from the submitted
        # form fields
        for ut_key, ut_dict in unordered_types.items():
            validated_objects = {}

            # Iterate through each of the objects in this object type's set to attempt to validate the object
            for o_key, o_dict in ut_dict["objects"].items():
                if (
                    (ut_dict["ordering_field"] in o_dict)
                    and (o_dict[ut_dict["ordering_field"]] != "")
                ):
                    # The object contains the expected field used for indicating the desired position and it is not empty, continue

                    # Initialize the "object is OK flag"
                    object_ok = True

                    # Convert the value in the ordering field to an integer, defaulting to zero
                    try:
                        o_dict[ut_dict["ordering_field"]] = int(o_dict[ut_dict["ordering_field"]])
                    except:
                        o_dict[ut_dict["ordering_field"]] = 0

                    if (o_dict[ut_dict["ordering_field"]] <= 0):
                        # There was a problem with the ordering field's value, set the OK flag accordingly
                        object_ok = False
                    else:
                        # The ordering field's value is syntactically valid, attempt to validate the object

                        # Iterate over this object type's validation rules to check the object
                        for field_key, field_dict in ut_dict["field_validation"].items():
                            if (object_ok):
                                # No problems have been found yet with this object, keep checking

                                if ((field_dict["required"]) and (field_key not in o_dict)):
                                    # This field is required, but it is not present, set the OK flag to False
                                    object_ok = False
                                elif (field_key in o_dict):
                                    # This field is either required and present; or is not required, but is present, continue validating

                                    if ((not field_dict["can_be_empty"]) and (o_dict[field_key] == "")):
                                        # This field cannot be empty, but it is; set the OK flag to False
                                        object_ok = False
                                    elif ((o_dict[field_key] != "") and (field_dict["type"] != "string")):
                                        # This field is not empty and is supposed to be something other than a string, check it

                                        if (field_dict["type"] == "integer"):
                                            # This field is supposed to be an integer, attempt to convert it to one
                                            try:
                                                o_dict[field_key] = int(o_dict[field_key])
                                            except:
                                                object_ok = False

                                    if ((object_ok) and ("valid_options" in field_dict)):
                                        check = [option for option in field_dict["valid_options"] if (option == o_dict[field_key])]
                                        if (len(check) == 0):
                                            object_ok = False

                    if (object_ok):
                        # This object has been validated, save a reference to it in validated_objects
                        # There was a problem validating this object, remove it from the set of objects for this type
                        validated_objects[o_key] = o_dict

            # Copy the dictionary of validated objects back into this type's objects attribute
            ut_dict["objects"] = validated_objects

        # Now iterate through each unordered type's objects and attempt to place them in the desired order
        for ut_key, ut_dict in unordered_types.items():

            # Iterate through each of the objects within this object type to retrieve the ordered list in which it should be placed
            for o_key, o_dict in ut_dict["objects"].items():
                # Split the object's key to produce an ordered list of the key portions for its full lineage
                lineage_keys = o_key.split("_")

                # Initialize the values used to confirm that this object's lineage is intact, i.e. that all of the objects in the
                # lineage exist within their unordered object type
                i = 0
                iTo = len(lineage_keys)
                lineage_intact = True
                key = ""

                # Iterate over the lineage_keys and confirm that everything is intact
                while ((i < iTo) and (lineage_intact)):
                    # Set the new key value for the object being checked, then check to see if it exists within the expected object type
                    key = lineage_keys[i] if (key == "") else key + "_" + lineage_keys[i]
                    lineage_intact =  (key in unordered_types[ut_dict["type_lineage"][i]]["objects"])
                    # Increment to the next element in the list
                    i = i + 1

                # Look for the desired list object to which o_dict will be added
                ordering_list = None
                if (lineage_intact):
                    # The object's full lineage is intact, continue

                    if (("parent_object_type" in ut_dict) and (ut_dict["parent_object_type"] != "")):
                        # This object is the child of another object, this means that it will be part of an attribute within that parent object

                        # Initialize the values used to build the parent's key
                        i = 0
                        parent_key_index = len(lineage_keys) - 2
                        parent_key = ""

                        # Iterate over the relevant part of lineage_keys to build parent_key
                        while (i <= parent_key_index):
                            parent_key = lineage_keys[i] if (parent_key == "") else parent_key + "_" + lineage_keys[i]
                            i = i + 1

                        if (
                            (parent_key_index >= 0)
                            and (parent_key in unordered_types[ut_dict["type_lineage"][parent_key_index]]["objects"])
                        ):
                            # parent_key was built and is found within the expected unordered object type, make sure that it includes the attribute
                            # that will hold this object

                            if (ut_dict["parent_field"] not in unordered_types[ut_dict["type_lineage"][parent_key_index]]["objects"][parent_key]):
                                # The field that will hold this object was not found, add it to the object
                                unordered_types[ut_dict["type_lineage"][parent_key_index]]["objects"][parent_key][ut_dict["parent_field"]] = []

                            # Get a reference to the parent's attribute that will hold this object to use as the desired list object
                            ordering_list = unordered_types[ut_dict["type_lineage"][parent_key_index]]["objects"][parent_key][ut_dict["parent_field"]]
                    elif ("desired_order" in ut_dict):
                        # This object is not a child of another object, and it has a "desired_order" attribute
                        # Get a reference to the desired_order attribute to use as the desired list object
                        ordering_list = ut_dict["desired_order"]

                if (isinstance(ordering_list, list)):
                    # The desired list object was found, add this object to it

                    list_index = o_dict[ut_dict["ordering_field"]] - 1
                    while (list_index >= len(ordering_list)):
                        ordering_list.append(None)

                    if (not ordering_list[list_index]):
                        ordering_list[list_index] = {}
                        ordering_list[list_index]["original_key"] = o_key

                    for field_key, field_value in o_dict.items():
                        ordering_list[list_index][field_key] = field_value

        # Iterate through each of the stream objects in order to make an addition to each stream's scenarios
        for stream_key, stream_dict in unordered_types["evidence_profile_streams"]["objects"].items():
            if ("scenarios" in stream_dict):
                # This stream has a set of scenarios, iterate over them and add the following keys and initialize them to empty lists:
                #   * scenarios
                #   * confidencefactors_increase
                #   * confidencefactors_decrease

                for scenario in stream_dict["scenarios"]:
                    scenario["studies"] = []
                    scenario["confidencefactors_increase"] = []
                    scenario["confidencefactors_decrease"] = []

                    if ((scenario["summary_of_findings_title"] != "") or (scenario["summary_of_findings_summary"] != "")):
                        # The summary of findings is not empty, save it as an object

                        scenario["summary_of_findings"] = {
                            "title": scenario["summary_of_findings_title"],
                            "summary": scenario["summary_of_findings_summary"]
                        }
                    else:
                        # The summary of findings is empty, save an empty object instead
                        scenario["summary_of_findings"] = {}

                    # Remove the scenario fields related the the summary of findings
                    del scenario["summary_of_findings_title"]
                    del scenario["summary_of_findings_summary"]

                    if ((scenario["outcome_title"] != "") or (scenario["outcome_explanation"] != "")):
                        # The outcome is not empty, save it as an object

                        scenario["outcome"] = {
                            "title": scenario["outcome_title"],
                            "explanation": scenario["outcome_explanation"],
                            "score": scenario["outcome_score"],
                            "name": confidence_judgement_dict[scenario["outcome_score"]] if (scenario["outcome_score"] in confidence_judgement_dict) else "",
                        }
                    else:
                        # The outcome is empty, save an empty object instead
                        scenario["outcome"] = {}

                    # Delete the individual outcome-related fields from the cleaned submitted data (they were just combined into a single "outcome" attribute)
                    del scenario["outcome_title"]
                    del scenario["outcome_explanation"]
                    del scenario["outcome_score"]

                    if ("original_key" in scenario):
                        # This scenario includes an attribute named original_key

                        if (scenario["original_key"] in unordered_types["stream_scenarios"]["objects"]):
                            # original_key's value is an attribute in the set of objects within stream_scenarios; look for studes and confidence factors

                            if ("effectTags" in unordered_types["stream_scenarios"]["objects"][scenario["original_key"]]):
                                # This scenario has a set of effectTags, iterate over them to build the studies key's value

                                for effectTag in unordered_types["stream_scenarios"]["objects"][scenario["original_key"]]["effectTags"]:
                                    scenario["studies"].append(
                                        {
                                            "effecttag_id": effectTag["pk"],
                                            "studies": [],
                                        }
                                    )

                                    if ((effectTag["original_key"] in unordered_types["effect_tags"]["objects"]) and ("studies" in unordered_types["effect_tags"]["objects"][effectTag["original_key"]])):
                                        # This effectTag object has a studies attribute, iterate through it to add each study's primary key to the studies[].studies array
                                        studyIndex = len(scenario["studies"]) - 1
                                        if (studyIndex >= 0):
                                            for study in unordered_types["effect_tags"]["objects"][effectTag["original_key"]]["studies"]:
                                                scenario["studies"][studyIndex]["studies"].append(study["pk"])

                            if ("confidenceFactorsIncrease" in unordered_types["stream_scenarios"]["objects"][scenario["original_key"]]):
                                # This scenario has a set of confidenceFactorsIncrease values, iterate over them to build the
                                # confidencefactors_increase key's value

                                for confidenceFactor in unordered_types["stream_scenarios"]["objects"][scenario["original_key"]]["confidenceFactorsIncrease"]:
                                    scenario["confidencefactors_increase"].append(
                                        {
                                            "confidencefactor_id": confidenceFactor["pk"],
                                            "explanation": confidenceFactor["explanation"] if (confidenceFactor["explanation"] is not None) else "",
                                        }
                                    )

                            if ("confidenceFactorsDecrease" in unordered_types["stream_scenarios"]["objects"][scenario["original_key"]]):
                                # This scenario has a set of confidenceFactorsDecrease values, iterate over them to build the
                                # confidencefactors_decrease key's value

                                for confidenceFactor in unordered_types["stream_scenarios"]["objects"][scenario["original_key"]]["confidenceFactorsDecrease"]:
                                    scenario["confidencefactors_decrease"].append(
                                        {
                                            "confidencefactor_id": confidenceFactor["pk"],
                                            "explanation": confidenceFactor["explanation"] if (confidenceFactor["explanation"] is not None) else "",
                                        }
                                    )

                        # Remove the original_key since it is no longer needed and was only relevent within this instantiation
                        del scenario["original_key"]

        # Finally, iterate through the unordered object types that have a desired_order attribute and make sure that it contains the same object that
        # is found in the objects attribute
        for ut_key in [ut_key for ut_key, ut_dict in unordered_types.items() if ("desired_order" in ut_dict)]:
            # Iterate through the objects within this object type and make sure that each one is copied to the desired position in desired_order
            for o_key, o_dict in unordered_types[ut_key]["objects"].items():
                unordered_types[ut_key]["desired_order"][o_dict[unordered_types[ut_key]["ordering_field"]] - 1] = o_dict

                if (not unordered_types[ut_key]["retain_ordering_field"]):
                    # This object's ordering field does not need to be retained, get rid of it
                    unordered_types[ut_key]["desired_order"][o_dict[unordered_types[ut_key]["ordering_field"]] - 1].pop(unordered_types[ut_key]["ordering_field"])

            # Get rid of any element in the desired order list that is empty
            unordered_types[ut_key]["desired_order"] = [object for object in unordered_types[ut_key]["desired_order"] if (object)]

        # Convert the evidence profile stream objects that were built from submitted form data into the format that matches the
        # EvidenceProfileStream class
        unordered_types["evidence_profile_streams"]["desired_order"] = [
            {
                "pk": stream["pk"],
                "stream_type": stream["stream_type"],
                "stream_title": stream["stream_title"],
                "order": (10 * (index + 1)),
                "confidence_judgement": {
                    "title": stream["confidence_judgement_title"],
                    "score": stream["confidence_judgement_score"],
                    "name": confidence_judgement_dict[stream["confidence_judgement_score"]],
                    "explanation": stream["confidence_judgement_explanation"],
                },
                "summary_of_findings": {
                    "title": stream["summary_of_findings_title"] if ("summary_of_findings_title" in stream) else "",
                    "summary": stream["summary_of_findings_summary"] if ("summary_of_findings_summary" in stream) else "",
                },
                "scenarios": [{key:scenario[key] if (key != "order") else (scenario[key] * 10) for key in scenario} for scenario in stream["scenarios"]] if ("scenarios" in stream) else [],
            }
            for index, stream
            in enumerate(unordered_types["evidence_profile_streams"]["desired_order"])
        ]

        cleaned_data["scenarios"] = {}

        # Now iterate through each evidence profile stream and set each scenario's full outcome attribute from its submitted value and then move the
        # stream's set of scenarios out to cleaned_data["scenarios"]
        # The scenarios are moved because they are child objects stored in a separate, related database table
        for index, stream in enumerate(unordered_types["evidence_profile_streams"]["desired_order"]):
            # Move this stream's scenario objects out to an object named cleaned_data["scenarios"] and remove it from this stream object
            cleaned_data["scenarios"][index] = stream["scenarios"]
            del stream["scenarios"]

        # Create an object in the cleaned data that is made of of data related to each of the streams within this evidence profile
        cleaned_data["streams"] = unordered_types["evidence_profile_streams"]["desired_order"]

        # Create an object in the cleaned data that is made up of data related to inferences and judgements across all streams
        # within this evidence profile
        cleaned_data["cross_stream_confidence_judgement"] = {
            "score": cleaned_data.get("confidence_judgement_score"),
            "title": cleaned_data.get("confidence_judgement_title"),
            "explanation": cleaned_data.get("confidence_judgement_explanation"),
        }

        # Create an object in the cleaned data that is made of the data related to each cross-stream inference within this evidence profile
        cleaned_data["cross_stream_inferences"] = unordered_types["cross_stream_inferences"]["desired_order"]

        return cleaned_data
