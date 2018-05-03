from collections import OrderedDict
import json
import re

from django.db.models import QuerySet
from crispy_forms import layout as cfl
from django import forms
from django.core.urlresolvers import reverse
from selectable import forms as selectable

from assessment.models import EffectTag
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
        if value and isinstance(value, QuerySet):
            value = Endpoint.objects.filter(id__in=value.values_list('id', flat=True))
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['file'].help_text += """<br>
            For more details on saving in this format from Excel,
            <a href="{0}" target="_blank">click here</a>.
            """.format(reverse('summary:dp_excel-unicode'))


class DataPivotQueryForm(PrefilterMixin, DataPivotForm):

    prefilter_include = ('study', 'bioassay', 'epi', 'invitro', 'effect_tags')

    class Meta:
        model = models.DataPivotQuery
        fields = ('evidence_type', 'export_style', 'title', 'preferred_units',
                  'slug', 'settings', 'caption',
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
        fields = ('title', 'slug', 'settings', 'caption', )

    # This is the initialization method for this form object
    def __init__(self, *args, **kwargs):
        # Before doing anything else, get an un=modified copy of the incoming submitted data for use later
        self.submitted_data = kwargs.get("data", None)

        # Attempt to get a reference to this object's parent Assessment object, and then run the superclass's initialization method
        assessment = kwargs.pop('parent', None)
        super().__init__(*args, **kwargs)

        if (assessment):
            # A parent Assessment object was found, copy a reference to it into this object's instance
            self.instance.assessment = assessment

        # Get the initial values for the fields related to cross-stream conclusions
        initial_confidence_judgement_rating = ""
        initial_confidence_judgement_explanation = ""
        if (self.instance.cross_stream_conclusions != ""):
            # This Evidence Profile object has a non-empty cross_stream_conclusions field, set initial values from it
            try:
                conclusionsJSON = json.loads(self.instance.cross_stream_conclusions)
                initial_confidence_judgement_rating = conclusionsJSON["confidence_judgement"]["rating"]
                initial_confidence_judgement_explanation = conclusionsJSON["confidence_judgement"]["explanation"]
            except:
                pass

        # Create an ordered dictionary of new fields that will be added to the form
        new_fields = OrderedDict()
        new_fields.update(
            [
                (
                    "confidence_judgement_rating"
                    ,forms.IntegerField(
                        required = False
                        ,label = "Rating (0 - 5)"
                        ,initial = initial_confidence_judgement_rating
                        ,min_value = 0
                        ,max_value = 5
                        ,help_text = "Overall rating for confidence in this studies presented in this evidence profile (across all evidence streams)"
                        ,widget = forms.NumberInput(
                            attrs = {
                                "style": "width:48px;"
                            }
                        )
                    )
                )
                ,(
                    "confidence_judgement_explanation"
                    ,forms.CharField(
                        required = False
                        ,label = "Explanation"
                        ,initial = initial_confidence_judgement_explanation
                        ,help_text = "Explain why you selected the overall rating you did"
                        ,widget = forms.Textarea(
                            attrs = {
                                "rows": 2
                            }
                        )
                    )
                )
            ]
        )

        # Iterate through the new set of fields and add them to self.fields
        for key, value in new_fields.items():
            self.fields[key] = value

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

            if (fieldName == "settings"):
                # For the "settings" field, constrain their textarea height to two rows
                self.fields[fieldName].widget.attrs["rows"] = 2

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

        # Initialize a dict to hold objects made up of related sets of form data, along with information about their form field naming conventions
        # This object will be used as a temporary store to be built up while iterating over the incoming form key/value pairs; and then ordering of
        # the objects will be done after they have all been built
        unordered_objects = {
            "cross_stream_inferences": {
                "objects": {},
                "desired_order": [],
                "ordering_field": "order",
                "re_match": r"^inference_(order|title|explanation)_\d+$",
                "re_replace_index": r"\D",
                "re_replace_index_with": r"",
                "re_replace_key": r"^inference_(order|title|explanation)_\d+$",
                "re_replace_key_with": r"\1"
            }
        }

        # Iterate over the submitted form fields
        for form_key in self.submitted_data:

            # Iterate over the sets of unordered objects
            for uo_key in unordered_objects:
                if (re.search(unordered_objects[uo_key]["re_match"], form_key)):
                    # This form field name matched the naming convention corresponding to one of the sets of objects

                    object_key = re.sub(unordered_objects[uo_key]["re_replace_index"], unordered_objects[uo_key]["re_replace_index_with"], form_key)
                    internal_key = re.sub(unordered_objects[uo_key]["re_replace_key"], unordered_objects[uo_key]["re_replace_key_with"], form_key)

                    if (not (object_key in unordered_objects[uo_key]["objects"])):
                        # The object of which this form field is a part has not yet been added to the set of unordered objects, initialize it now
                        unordered_objects[uo_key]["objects"][object_key] = {}

                    # Add the field to its object as an attribute
                    unordered_objects[uo_key]["objects"][object_key][internal_key] = self.submitted_data[form_key]

                    if (internal_key == unordered_objects[uo_key]["ordering_field"]):
                        # This field is the object's "ordering" field, use it to put an entry in the "desired_order" list

                    print("-- -- -- -- -- -- -- -- -- -- -- --")
                    print(form_key)
                    print(self.submitted_data[form_key])
                    print(object_key)
                    print(internal_key)

        print(unordered_objects)

        """
        # Next, iterate through the form fields looking for those that are part of cross-stream inferences
        inferences = []
        orderingFieldPattern = re.compile("^inference_order_\d+$")
        titleFieldPattern = re.compile("^inference_order_\d+$")
        explanationFieldPattern = re.compile("^inference_order_\d+$")
        replacePattern = re.compile("\D")
        for key in self.submitted_data:
            # Check and see if this form field's name matches either a cross-stream inference's ordering field

            if (orderingFieldPattern.match(key)):
                index = int(replacePattern.sub("", key)) - 1
                print(key)
                print(self.submitted_data[key])
                print(index)

                if (index >= 0):
                    while (len(inferences) <= index):
                        inferences.append(None)

                    if (isTitle):
                        if (inferences[index]):
                            inferences[index]["title"] = self.submitted_data[key]
                        else:
                            inferences[index] = {"title":self.submitted_data[key], "explanation":""}
                    else:
                        if (inferences[index]):
                            inferences[index]["explanation"] = self.submitted_data[key]
                        else:
                            inferences[index] = {"title":"", "explanation":self.submitted_data[key]}

        print(inferences)
        """

        # Now, create an object in the cleaned data that is made of of data related to inferences and judgements across all streams
        # within this evidence profile
        confidence_judgement = {
            "rating": cleaned_data.get("confidence_judgement_rating")
            ,"explanation": cleaned_data.get("confidence_judgement_explanation")
        }

        cleaned_data["cross_stream_conclusions"] = {
            "inferences": inferences
            ,"confidence_judgement": confidence_judgement
        }

        return cleaned_data
