import json
import pytz
from datetime import datetime

from django.core import serializers
from django.core.urlresolvers import reverse_lazy
from django.http import HttpResponse, Http404, HttpResponseRedirect, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.generic import TemplateView, FormView

from assessment.models import Assessment, ConfidenceFactor, ConfidenceJudgement, EffectTag
from assessment.serializers import ConfidenceFactorSerializer, ConfidenceJudgementSerializer, EffectTagSerializer
from riskofbias.models import RiskOfBiasMetric
from study.models import Study
from utils.helper import HAWCDjangoJSONEncoder
from utils.views import BaseList, BaseCreate, BaseDetail, BaseUpdate, BaseDelete, TeamMemberOrHigherMixin

from . import forms, models


# SUMMARY-TEXT
class SummaryTextJSON(BaseDetail):
    model = models.SummaryText

    def dispatch(self, *args, **kwargs):
        self.assessment = get_object_or_404(Assessment, pk=kwargs.get('pk'))
        self.permission_check_user_can_view()
        return super().dispatch(*args, **kwargs)

    def get(self, request, *args, **kwargs):
        content = self.model.get_assessment_descendants(self.assessment.id, json_encode=True)
        return HttpResponse(content, content_type="application/json")


class SummaryTextList(BaseList):
    parent_model = Assessment
    model = models.SummaryText

    def get_queryset(self):
        rt = self.model.get_assessment_root_node(self.assessment.id)
        return self.model.objects.filter(pk__in=[rt.pk])


def validSummaryTextChange(assessment_id):
    response = {
        "status": "ok",
        "content": models.SummaryText.get_assessment_descendants(assessment_id, json_encode=False)
    }
    return HttpResponse(
        json.dumps(response, cls=HAWCDjangoJSONEncoder),
        content_type="application/json"
    )


class SummaryTextCreate(BaseCreate):
    # Base view for all Create, Update, Delete GET operations
    parent_model = Assessment
    parent_template_name = 'assessment'
    model = models.SummaryText
    form_class = forms.SummaryTextForm

    def post(self, request, *args, **kwargs):
        if not request.is_ajax() or not request.user.is_authenticated():
            raise HttpResponseNotAllowed()
        return super().post(request, *args, **kwargs)

    def form_invalid(self, form):
        return HttpResponse(json.dumps(form.errors))

    def form_valid(self, form):
        self.object = self.model.create(form)
        return validSummaryTextChange(self.assessment.id)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['smart_tag_form'] = forms.SmartTagForm(assessment_id=self.assessment.id)
        return context


class SummaryTextUpdate(BaseUpdate):
    # AJAX POST-only
    model = models.SummaryText
    form_class = forms.SummaryTextForm
    success_message = None
    http_method_names = ['post', ]

    def post(self, request, *args, **kwargs):
        if not request.is_ajax():
            raise HttpResponseNotAllowed()
        return super().post(request, *args, **kwargs)

    def form_invalid(self, form):
        return HttpResponse(json.dumps(form.errors))

    def form_valid(self, form):
        self.object = self.object.update(form)
        return validSummaryTextChange(self.assessment.id)


class SummaryTextDelete(BaseDelete):
    # AJAX POST-only
    model = models.SummaryText
    success_message = None
    http_method_names = ['post', ]

    def post(self, request, *args, **kwargs):
        if not request.is_ajax():
            raise HttpResponseNotAllowed()
        return super().post(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.delete()
        return validSummaryTextChange(self.assessment.id)


# VISUALIZATIONS
class VisualizationList(BaseList):
    parent_model = Assessment
    model = models.Visual

    def get_queryset(self):
        return self.model.objects.get_qs(self.assessment)


class VisualizationDetail(BaseDetail):
    model = models.Visual


class VisualizationCreateSelector(BaseDetail):
    model = Assessment
    template_name = "summary/visual_selector.html"


class VisualizationCreate(BaseCreate):
    success_message = "Visualization created."
    parent_model = Assessment
    parent_template_name = 'assessment'
    model = models.Visual

    def get_form_class(self):
        visual_type = int(self.kwargs.get('visual_type'))
        try:
            return forms.get_visual_form(visual_type)
        except ValueError:
            raise Http404

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['visual_type'] = int(self.kwargs.get('visual_type'))
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['visual_type'] = int(self.kwargs.get('visual_type'))
        context['smart_tag_form'] = forms.SmartTagForm(assessment_id=self.assessment.id)
        context['rob_metrics'] = json.dumps(list(
            RiskOfBiasMetric.objects.get_metrics_for_visuals(self.assessment.id)))
        return context


class VisualizationCreateTester(VisualizationCreate):
    parent_model = Assessment
    http_method_names = ('post', )

    def post(self, request, *args, **kwargs):
        self.object = None
        form_class = self.get_form_class()
        form = self.get_form(form_class)
        response = form.instance.get_editing_dataset(request)
        return HttpResponse(response, content_type="application/json")


class VisualizationUpdate(BaseUpdate):
    success_message = 'Visualization updated.'
    model = models.Visual

    def get_form_class(self):
        try:
            return forms.get_visual_form(self.object.visual_type)
        except ValueError:
            raise Http404

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['visual_type'] = self.object.visual_type
        context['smart_tag_form'] = forms.SmartTagForm(assessment_id=self.assessment.id)
        context['rob_metrics'] = json.dumps(list(
            RiskOfBiasMetric.objects.get_metrics_for_visuals(self.assessment.id)))
        return context


class VisualizationDelete(BaseDelete):
    success_message = 'Visualization deleted.'
    model = models.Visual

    def get_success_url(self):
        return reverse_lazy('summary:visualization_list', kwargs={'pk': self.assessment.pk})


class RobFilter(BaseDetail):
    model = Assessment
    template_name = 'summary/robFilter.html'


# DATA-PIVOT
class ExcelUnicode(TemplateView):
    template_name = "summary/datapivot_save_as_unicode_modal.html"


class DataPivotNewPrompt(TemplateView):
    """
    Select if you wish to upload a file or use a query.
    """
    model = models.DataPivot
    crud = 'Read'
    template_name = 'summary/datapivot_type_selector.html'

    def dispatch(self, *args, **kwargs):
        self.assessment = get_object_or_404(Assessment, pk=kwargs['pk'])
        return super().dispatch(*args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['assessment'] = self.assessment
        return context


class DataPivotNew(BaseCreate):
    # abstract view; extended below for actual use
    parent_model = Assessment
    parent_template_name = 'assessment'
    success_message = 'Data Pivot created.'
    template_name = 'summary/datapivot_form.html'

    def get_success_url(self):
        super().get_success_url()
        return self.object.get_visualization_update_url()

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        if self.request.GET.get('reset_row_overrides'):
            kwargs['initial']['settings'] = \
                models.DataPivot.reset_row_overrides(kwargs['initial']['settings'])
        return kwargs


class DataPivotQueryNew(DataPivotNew):
    model = models.DataPivotQuery
    form_class = forms.DataPivotQueryForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['file_loader'] = False
        context['smart_tag_form'] = forms.SmartTagForm(assessment_id=self.assessment.id)
        return context


class DataPivotFileNew(DataPivotNew):
    model = models.DataPivotUpload
    form_class = forms.DataPivotUploadForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['file_loader'] = True
        context['smart_tag_form'] = forms.SmartTagForm(assessment_id=self.assessment.id)
        return context


class DataPivotCopyAsNewSelector(TeamMemberOrHigherMixin, FormView):
    # Select an existing assessed outcome as a template for a new one
    model = Assessment
    template_name = 'summary/datapivot_copy_selector.html'
    form_class = forms.DataPivotSelectorForm

    def get_assessment(self, request, *args, **kwargs):
        return get_object_or_404(Assessment, pk=self.kwargs.get('pk'))

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        dp = form.cleaned_data['dp']

        if hasattr(dp, 'datapivotupload'):
            url = reverse_lazy('summary:dp_new-file', kwargs={"pk": self.assessment.id})
        else:
            url = reverse_lazy('summary:dp_new-query', kwargs={"pk": self.assessment.id})

        url += "?initial={0}".format(dp.pk)

        if form.cleaned_data['reset_row_overrides']:
            url += '&reset_row_overrides=1'

        return HttpResponseRedirect(url)


class GetDataPivotObjectMixin(object):

    def get_object(self):
        slug = self.kwargs.get('slug')
        assessment = self.kwargs.get('pk')
        obj = get_object_or_404(models.DataPivot, assessment=assessment, slug=slug)
        if hasattr(obj, "datapivotquery"):
            obj = obj.datapivotquery
        else:
            obj = obj.datapivotupload
        return super().get_object(object=obj)


class DataPivotDetail(GetDataPivotObjectMixin, BaseDetail):
    model = models.DataPivot
    template_name = "summary/datapivot_detail.html"


class DataPivotData(GetDataPivotObjectMixin, BaseDetail):
    model = models.DataPivot

    def get_export_format(self):
        format_ = self.request.GET.get("format", "excel")
        if format_ not in ["tsv", "excel"]:
            raise Http404()
        return format_

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        format_ = self.get_export_format()
        return self.object.get_dataset(format_)


class DataPivotUpdateSettings(GetDataPivotObjectMixin, BaseUpdate):
    success_message = 'Data Pivot updated.'
    model = models.DataPivot
    form_class = forms.DataPivotSettingsForm
    template_name = 'summary/datapivot_update_settings.html'


class DataPivotUpdateQuery(GetDataPivotObjectMixin, BaseUpdate):
    success_message = 'Data Pivot updated.'
    model = models.DataPivotQuery
    form_class = forms.DataPivotQueryForm
    template_name = 'summary/datapivot_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['file_loader'] = False
        context['smart_tag_form'] = forms.SmartTagForm(assessment_id=self.assessment.id)
        return context


class DataPivotUpdateFile(GetDataPivotObjectMixin, BaseUpdate):
    success_message = 'Data Pivot updated.'
    model = models.DataPivotUpload
    form_class = forms.DataPivotUploadForm
    template_name = 'summary/datapivot_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['file_loader'] = True
        context['smart_tag_form'] = forms.SmartTagForm(assessment_id=self.assessment.id)
        return context


class DataPivotDelete(GetDataPivotObjectMixin, BaseDelete):
    success_message = 'Data Pivot deleted.'
    model = models.DataPivot
    template_name = "summary/datapivot_confirm_delete.html"

    def get_success_url(self):
        return reverse_lazy('summary:visualization_list', kwargs={'pk': self.assessment.pk})


# This class is a "mix-in" superclass for use within Evidence Profile-related views that attempts to retrieve the desired object from the
# database
class GetEvidenceProfileObjectMixin(object):
    # This method is the one that attempts to get the object from the database
    def get_object(self):
        # Get the 'slug' and the parent Assessent's primary key value from the URL
        slug = self.kwargs.get('slug')
        assessment = self.kwargs.get('pk')

        # Attempt to get the objectusing the assessment and slug derived from the URL
        obj = get_object_or_404(models.EvidenceProfile, assessment=assessment, slug=slug)

        # Return the object retrieved
        return super().get_object(object=obj)


# This class is used for creating a new Evidence Profile object
class EvidenceProfileNew(BaseCreate):
    # Set some basic attributes for this view
    parent_model = Assessment
    parent_template_name = 'assessment'
    success_message = 'Evidence Profile created.'
    template_name = 'summary/evidenceprofile_form.html'

    # Define the type of object being created and the form object that will be used
    model = models.EvidenceProfile
    form_class = forms.EvidenceProfileForm

    # This method returns the URL that the requestor will be re-directed to after this request is handled
    def get_success_url(self):
        # Get the value for this Evidence Profile's visualization URL and return it
        # Currently returning the "Update" URL, change this later when desired
        return self.object.get_update_url()

    def get_context_data(self, **kwargs):
        # Get the basic context attributes from the superclass's get_context_data() method
        context = super().get_context_data(**kwargs)

        # Set the desired additional context attributes to their initialized, empty values
        context.update(getEvidenceProfileContextData(self.object, self.assessment))

        return context

    # This method handles a valid submitted form
    def form_valid(self, form):
        # Set the object model's cross-stream related fields to JSON-formatted strings based on the cleaned data from the submitted form
        form.instance.cross_stream_confidence_judgement = json.dumps(form.cleaned_data.get("cross_stream_confidence_judgement"))
        form.instance.cross_stream_inferences = json.dumps(form.cleaned_data.get("cross_stream_inferences"))

        # Set the object model's hawcuser object to the logged-in user before calling the super-class's form_valid() method
        form.instance.hawcuser = self.request.user

        return super().form_valid(form)

    # This method is automatically called by the superclass's form_valid() method; this method is used within this class to handle the saving
    # of all of the child Streams and grandchild Scenarios
    def post_object_save(self, form):
        # Iterate through the streams from the cleaned data and use each one to create a new EvidenceProfileStream object
        scenarios = form.cleaned_data.get("scenarios")
        for index, stream in enumerate(form.cleaned_data.get("streams")):
            streamToSave = models.EvidenceProfileStream(
                evidenceprofile = self.object,
                hawcuser = self.request.user,
                stream_type = stream["stream_type"],
                stream_title = stream["stream_title"],
                confidence_judgement = json.dumps(stream["confidence_judgement"]),
                summary_of_findings = stream["summary_of_findings"],
                order = stream["order"],
            )

            streamToSave.save()

            if (index in scenarios):
                # This stream has an accompanying set of scenarios, save them to the database
                for scenario in scenarios[index]:
                    scenarioToSave = models.EvidenceProfileScenario(
                        pk = (scenario["pk"] if (scenario["pk"] > 0) else None),
                        evidenceprofilestream = streamToSave,
                        hawcuser = self.request.user,
                        scenario_name = scenario["scenario_name"],
                        outcome = json.dumps(scenario["outcome"]),
                        summary_of_findings = scenario["summary_of_findings"],
                        studies = json.dumps(scenario["studies"]),
                        confidencefactors_increase = json.dumps(scenario["confidencefactors_increase"]),
                        confidencefactors_decrease = json.dumps(scenario["confidencefactors_decrease"]),
                        order = scenario["order"],
                        created = pytz.timezone(timezone.get_default_timezone_name()).localize(datetime.now()),
                    )

                    scenarioToSave.save();

class EvidenceProfileUpdate(GetEvidenceProfileObjectMixin, BaseUpdate):
    success_message = 'Evidence Profile updated.'
    model = models.EvidenceProfile
    form_class = forms.EvidenceProfileForm
    template_name = 'summary/evidenceprofile_form.html'

    # This method returns the URL that the requestor will be re-directed to after this request is handled
    def get_success_url(self):
        # Get the value for this Evidence Profile's visualization URL and return it
        return self.object.get_absolute_url()

    def get_context_data(self, **kwargs):
        # Get the basic context attributes from the superclass's get_context_data() method
        context = super().get_context_data(**kwargs)

        # Set the desired additional context attributes based on the values of the existing Evidence Profile
        context.update(getEvidenceProfileContextData(self.object, self.assessment))

        return context

    # This method handles a valid submitted form
    def form_valid(self, form):
        # Set the object model's cross-stream related fields to JSON-formatted strings based on the cleaned data from the submitted form
        form.instance.cross_stream_confidence_judgement = json.dumps(form.cleaned_data.get("cross_stream_confidence_judgement"))
        form.instance.cross_stream_inferences = json.dumps(form.cleaned_data.get("cross_stream_inferences"))

        return super().form_valid(form)

    # This method is automatically called by the superclass's form_valid() method; this method is used within this class to handle the saving
    # of all of the child Streams and grandchild Scenarios
    def post_object_save(self, form):
        # Build a list of primary keys for each existing stream that is not part of the submitted data -- these streams will be deleted
        streamsToDelete = [currentStream["pk"] for currentStream in self.object.streams.all().values("pk") if (currentStream["pk"] not in [newStream["pk"] for newStream in form.cleaned_data.get("streams")])]

        # Iterate through the streams from the cleaned data and use each one to create a new EvidenceProfileStream object
        scenarios = form.cleaned_data.get("scenarios")
        for index, stream in enumerate(form.cleaned_data.get("streams")):

            # Either load an existing stream or create a new one
            streamToSave = None
            if (stream["pk"] > 0):
                # A primary key was passed in for this stream, try to get it from the database, defaulting to a new stream object is something goes wrong

                try:
                    streamToSave = models.EvidenceProfileStream.objects.get(id=stream["pk"])
                except:
                    streamToSave = models.EvidenceProfileStream()
            else:
                # No primary key was passed in for this stream, create a new stream object
                streamToSave = models.EvidenceProfileStream()

            # Set the stream object's attributes based on the submitted form data
            streamToSave.evidenceprofile = self.object
            streamToSave.hawcuser = self.request.user
            streamToSave.stream_type = stream["stream_type"]
            streamToSave.stream_title = stream["stream_title"]
            streamToSave.confidence_judgement = json.dumps(stream["confidence_judgement"])
            streamToSave.summary_of_findings = stream["summary_of_findings"]
            streamToSave.order = stream["order"]

            streamToSave.save()

            if (index in scenarios):
                # Build a list of primary keys for each existing scenario that is not part of the submitted data -- thesescenarios will be deleted
                scenariosToDelete = [currentScenario["pk"] for currentScenario in models.EvidenceProfileScenario.objects.filter(evidenceprofilestream=streamToSave).values("pk") if (currentScenario["pk"] not in [newScenario["pk"] for newScenario in [scenario for stream_pk, scenario in scenarios.items() if (stream_pk == index)][0] if newScenario["pk"] > 0])]

                # This stream has an accompanying set of scenarios, iterate through them and save each one to the database
                for scenario in scenarios[index]:

                    # Either load an existing scenario or create a new one
                    scenarioToSave = None
                    if (scenario["pk"] > 0):
                        # A primary key was passed in for this scenario, try to get it from the database, defaulting to a new scenario object is something goes wrong

                        try:
                            scenarioToSave = models.EvidenceProfileScenario.objects.get(id=scenario["pk"])
                        except:
                            scenarioToSave = models.EvidenceProfileScenario()
                    else:
                        # No primary key was passed in for this scenario, create a new scenario object
                        scenarioToSave = models.EvidenceProfileScenario()

                    # Set the scenario object's attributes based on the submitted form data
                    scenarioToSave.evidenceprofilestream = streamToSave
                    scenarioToSave.hawcuser = self.request.user
                    scenarioToSave.scenario_name = scenario["scenario_name"]
                    scenarioToSave.outcome = json.dumps(scenario["outcome"])
                    scenarioToSave.summary_of_findings = scenario["summary_of_findings"]
                    scenarioToSave.studies = json.dumps(scenario["studies"])
                    scenarioToSave.confidencefactors_increase = json.dumps(scenario["confidencefactors_increase"])
                    scenarioToSave.confidencefactors_decrease = json.dumps(scenario["confidencefactors_decrease"])
                    scenarioToSave.order = scenario["order"]

                    scenarioToSave.save();

                # Iterate through the list of old scenarios that need to be deleted from this stream and delete them
                for pk in scenariosToDelete:
                    models.EvidenceProfileScenario.objects.get(id=pk).delete()

        # Iterate through the list of old streams that need to be deleted and delete them
        for pk in streamsToDelete:
            models.EvidenceProfileStream.objects.get(id=pk).delete()


class EvidenceProfileDetail(GetEvidenceProfileObjectMixin, BaseDetail):
    model = models.EvidenceProfile
    template_name = "summary/evidenceprofile_detail.html"

    def get_context_data(self, **kwargs):
        # Get the basic context attributes from the superclass's get_context_data() method
        returnValue = super().get_context_data(**kwargs)

        # Load the entire EvidenceProfile object into a dictionary object and convert it to a JSON-formatted string (this will then be treated
        # as an object by the client-side JavaScript)
        returnValue["evidenceProfile"] = getCompleteEvidenceProfileDictionary(self.object)

        returnValue["tableBodyRows"] = 0
        returnValue["streamDataRows"] = {}

        # Count up the total number of rows that will be in the body of the generated table
        if (len(returnValue["evidenceProfile"]["streams"]) > 0):
            # This EvidenceProfile has at least one Stream, iterate over the Streams to build the total count

            for stream in returnValue["evidenceProfile"]["streams"]:
                # For this stream, set its streamDataRows to the number of scenarios it contains, or a miminum of one
                returnValue["streamDataRows"][stream["pk"]] = max(1, len(stream["scenarios"]))

                # For the total rows in the body of the table, add an additional row to account for the stream's title
                returnValue["tableBodyRows"] = returnValue["tableBodyRows"] + returnValue["streamDataRows"][stream["pk"]] + 1
        else:
            # This EvidenceProfile has no streams, thus it only has only one row (one saying "No Streams")
            returnValue["tableBodyRows"] = 1

        # Get a JSON-friendly version of the available stream type options
        returnValue["stream_types"] = {type["value"]: type["name"] for type in models.get_serialized_stream_types()}

        # Begin building a list of table cloumns that will be shown on the page, only include the outcome column (scenario name) if the evidence
        # profile table's streams are not limited to only one scenario per stream
        returnValue["columnsToShow"] = ["outcome"] if (not returnValue["evidenceProfile"]["one_scenario_per_stream"]) else []
        returnValue["columnsToShow"].extend(["studies", "increaseConfidence", "decreaseConfidence"])

        if (returnValue["evidenceProfile"]["one_scenario_per_stream"]):
            # This evidence profile table's streams are limited to only one scenario per stream, check to see if the scenario confidence judgement column
            # needs to be included in the table by iterating over each scenario within each stream and counting all those that include either a confidence
            # judgement (outcome) or a summary of findings

            scenarioConfidenceJudgementCount = 0
            for stream in returnValue["evidenceProfile"]["streams"]:
                for scenario in stream["scenarios"]:
                    if ((scenario["outcome"] != {}) or (scenario["summary_of_findings"] != {})):
                        scenarioConfidenceJudgementCount = scenarioConfidenceJudgementCount + 1

            if (scenarioConfidenceJudgementCount > 0):
                # At least one scenario had a confidence judgement or a summary of findings, add the scenario confidence judgement column to the table
                returnValue["columnsToShow"].append("scenarioConfidenceJudgement")
        else:
            # This evidence profile table's streams are not limited to only one scenario per stream, add the scenario confidence judgement column to the table
            returnValue["columnsToShow"].append("scenarioConfidenceJudgement")

        # Add the remaining columns that will be included in the table
        returnValue["columnsToShow"].extend(["streamConfidenceJudgement", "crossStreamInference", "crossStreamConfidenceJudgement"])

        # The stream names will span two fewer columns than the total width
        returnValue["streamNameSpan"] = len(returnValue["columnsToShow"]) - 2
        returnValue["columnWidth"] = 100 / len(returnValue["columnsToShow"])

        return returnValue


class EvidenceProfileDelete(GetEvidenceProfileObjectMixin, BaseDelete):
    success_message = 'Evidence Profile deleted.'
    model = models.EvidenceProfile
    template_name = "summary/evidenceprofile_confirm_delete.html"

    def get_success_url(self):
        return reverse_lazy('summary:visualization_list', kwargs={'pk': self.assessment.pk})


# This function returns the set of serialized objects that are commonly used as context data for Evidence Profile objects
def getEvidenceProfileContextData(object:models.EvidenceProfile, assessment:Assessment):
    returnValue = {}

    # Get serializer objects that will be used to generate serialized objects from lookup tables
    confidenceFactorSerializer = ConfidenceFactorSerializer()
    confidenceJudgementSerializer = ConfidenceJudgementSerializer()
    effectTagSerializer = EffectTagSerializer()

    # Get a JSON-friendly version of the available stream type options
    returnValue["stream_types"] = models.get_serialized_stream_types()

    # Retrieve only the values from each of the factors that INCREASE confidence in the lookup table and serialize them into a
    # JSON-formatted string
    returnValue["confidence_factors_increase"] = json.dumps([confidenceFactorSerializer.to_representation(confidenceFactor) for confidenceFactor in ConfidenceFactor.objects.filter(increases_confidence=True).order_by("name")])

    # Retrieve only the values from each of the factors that DECREASE confidence in the lookup table and serialize them into a
    # JSON-formatted string
    returnValue["confidence_factors_decrease"] = json.dumps([confidenceFactorSerializer.to_representation(confidenceFactor) for confidenceFactor in ConfidenceFactor.objects.filter(decreases_confidence=True).order_by("name")])

    # Retrieve all the values from the confidence judgements lookup table and serialize them into a JSON-formatted string
    returnValue["confidence_judgements"] = json.dumps([confidenceJudgementSerializer.to_representation(confidenceJudgement) for confidenceJudgement in ConfidenceJudgement.objects.all().order_by("value")])

    # Retrieve all the values from the effect tags lookup table and serialize them into a JSON-formatted string
    returnValue["effect_tags"] = json.dumps([effectTagSerializer.to_representation(effectTag) for effectTag in EffectTag.objects.all().order_by("name")])

    # Load the entire EvidenceProfile object into a dictionary object and convert it to a JSON-formatted string (this will then be treated as an object
    # by the client-side JavaScript)
    returnValue["evidenceProfile"] = json.dumps(getEvidenceProfileDictionary(object))

    # Load all of the Studies that are part of this Evidence Profile's parent Assessment
    availableStudies = Study.objects.get_choices(assessment)
    returnValue["availableStudies"] = json.dumps(
        {
            "studies": [{study[0]:study[1]} for study in availableStudies],
            "values": [study[0] for study in availableStudies],
        }
    )

    return returnValue


# September 12, 2018, Jay Buie
# This function was abstracted out from the getEvidenceProfileContextData() function above because there are times when an EvidenceProfile
# This function returns a complete EvidenceProfile object (including child streams and grandchild scenarios) as a dictionary object
def getEvidenceProfileDictionary(object):
    returnValue = {}

    if (object):
        # The incoming object is not empty, create a JSON-friendly version of it, and include an additional attribute for the
        # profile's existing child streams
        returnValue = json.loads(serializers.serialize("json", [object, ]))[0]["fields"]
        returnValue["id"] = object.pk

        # Add a serialized version of the Evidence Profile object's streams to evidenceProfile, and copy the stream's primary key over into its
        # "fields" dictionary for retention in a later step
        streamObjectList = object.streams.all().order_by("order")
        returnValue["streams"] = json.loads(serializers.serialize("json", streamObjectList))
        for stream in returnValue["streams"]:
            stream["fields"]["pk"] = stream["pk"]
            stream["fields"]["scenarios"] = []

        i = 0
        iTo = len(streamObjectList)
        maxStreamIndex = len(returnValue["streams"]) - 1
        while ((i < iTo) and (i <= maxStreamIndex)):
            returnValue["streams"][i]["fields"]["scenarios"] = json.loads(serializers.serialize("json", streamObjectList[i].scenarios.all().order_by("order")))

            for scenario in returnValue["streams"][i]["fields"]["scenarios"]:
                scenario["fields"]["pk"] = scenario["pk"]

            returnValue["streams"][i]["fields"]["scenarios"][:] = [scenario["fields"] for scenario in returnValue["streams"][i]["fields"]["scenarios"] if (scenario)]

            i = i + 1
    else:
        # The incoming object is empty (creating a new object), create a JSON-friendly base model for it, include an additional attribute for the profile's child streams
        returnValue = json.loads(serializers.serialize("json", [models.EvidenceProfile(), ]))[0]["fields"]
        returnValue["id"] = models.EvidenceProfile().pk
        returnValue["streams"] = []

    returnValue["cross_stream_confidence_judgement"] = json.loads(returnValue["cross_stream_confidence_judgement"])
    returnValue["cross_stream_inferences"] = json.loads(returnValue["cross_stream_inferences"])

    # Any existing stream objects loaded from the database will have the actual data fields stored within a "fields" attribute; extract
    # that data from the fields attribute and retain only that portion of the original stream object
    returnValue["streams"][:] = [stream["fields"] for stream in returnValue["streams"] if (stream)]

    # Initialize a list to hold the primary keys of all the studies in the evidence profile
    study_id_list = []

    # Attempt to de-serialize each stream's "confidence_judgement" attribute and child scenarios
    for stream in returnValue["streams"]:
        try:
            stream["confidence_judgement"] = json.loads(stream["confidence_judgement"])
        except:
            stream["confidence_judgement"] = {}

        # Attempt to iterate through each scenario within this stream and de=serialize their "outcome," "studies," "confidencefactor_increase,"
        # "confidencefactor_decrease" attributes
        if ("scenarios" in stream):
            for scenario in stream["scenarios"]:
                try:
                    scenario["outcome"] = json.loads(scenario["outcome"])
                except:
                    scenario["outcome"] = {}

                try:
                    scenario["studies"] = json.loads(scenario["studies"])
                except:
                    scenario["studies"] = []

                # Iterate over the scenario's studies
                # Studies are grouped by "effect tags," so you have do two iterations
                for effectTag in scenario["studies"]:
                    for study_id in effectTag["studies"]:
                        if (study_id not in study_id_list):
                            # This study_id is not yet in study_id_list, add it now
                            study_id_list.append(study_id)

                try:
                    scenario["confidencefactors_increase"] = json.loads(scenario["confidencefactors_increase"])
                except:
                    scenario["confidencefactors_increase"] = []

                try:
                    scenario["confidencefactors_decrease"] = json.loads(scenario["confidencefactors_decrease"])
                except:
                    scenario["confidencefactors_decrease"] = []

    if ((returnValue["assessment"] is not None) and (len(study_id_list) > 0)):
        # This is an existing evidence profile and at least one study_id is part of the evidence profile, get each study's title and short citation

        # First, query the database and build a set of matching study objects
        studies = {study[0]:(study[1] + " (" + study[2] + ")") for study in Study.objects.filter(assessment=returnValue["assessment"]).filter(id__in=study_id_list).values_list("id", "title", "short_citation")}

        # Next, add the study titles/citations to each effect tag grouping within the evidence profile
        for stream in returnValue["streams"]:
            if ("scenarios" in stream):
                for scenario in stream["scenarios"]:
                    for effectTag in scenario["studies"]:
                        # Initialize a dictionary within this effect tag grouping that will map study titles/citations to the studies within this effect tag
                        effectTag["studyTitles"] = {}

                        # Iterate through the studies within this effect tag
                        for study_id in effectTag["studies"]:
                            if (study_id in studies):
                                effectTag["studyTitles"][study_id] = studies[study_id]

    return returnValue


# September 13, 2018, Jay Buie
# This function was abstracted out from the getEvidenceProfileDictionary() function above because there are times when the complete (including names for
# included studies and confidence factor) will need to be called from multiple places
def getCompleteEvidenceProfileDictionary(object):
    returnValue = {}

    if (object):
        # The incoming object is not empty, create a JSON-friendly version of it, and include an additional attribute for the
        # profile's existing child streams
        returnValue = getEvidenceProfileDictionary(object)

        # Attempt to find names for each:
        #   * stream -> scenario -> effectTag (studies are organized by effect tag)
        #   * stream -> scenario -> confidence factor (confidence factors are in two groups, those that increase confidence and those that decrease it)
        effectTags = {effectTag.id:effectTag.name for effectTag in EffectTag.objects.all()}

        confidenceFactors = {
            "increase": {confidenceFactor.id:confidenceFactor.name for confidenceFactor in ConfidenceFactor.objects.filter(increases_confidence=True)},
            "decrease": {confidenceFactor.id:confidenceFactor.name for confidenceFactor in ConfidenceFactor.objects.filter(increases_confidence=False)},
        }

        # Iterate over each stream within the evidence profile
        for stream in returnValue["streams"]:
            if ("scenarios" in stream):
                # This stream has a scenarios attribute, iterate over it to handle each scenario's studies and confidence factors

                for scenario in stream["scenarios"]:
                    # Iterate over the scenario's studies; studies are grouped by "effect tags," so you have do two iterations
                    for effectTag in scenario["studies"]:
                        effectTag["name"] = effectTags[effectTag["effecttag_id"]] if (effectTag["effecttag_id"] in effectTags) else ""

                    # Iterate over the scenario's confidence factors; confidence factors are in two different attributes
                    for i in ["increase", "decrease"]:
                        for confidenceFactor in scenario["confidencefactors_" + i]:
                            confidenceFactor["name"] = confidenceFactors[i][confidenceFactor["confidencefactor_id"]] if (confidenceFactor["confidencefactor_id"] in confidenceFactors[i]) else ""

    return returnValue
