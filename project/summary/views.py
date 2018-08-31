import os
import json
import pytz
from datetime import datetime

from django.core import serializers
from django.core.urlresolvers import reverse_lazy
from django.http import HttpResponse, Http404, HttpResponseRedirect, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.generic import TemplateView, FormView
import pandas as pd

from assessment.models import Assessment
from assessment.serializers import ConfidenceFactorSerializer, ConfidenceJudgementSerializer, EffectTagSerializer
from riskofbias.models import RiskOfBiasMetric
from utils.helper import HAWCDjangoJSONEncoder
from utils.views import BaseList, BaseCreate, BaseDetail, BaseUpdate, BaseDelete, TeamMemberOrHigherMixin
from assessment.models import ConfidenceFactor, ConfidenceJudgement, EffectTag

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

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['show_published'] = self.assessment.user_is_part_of_team(self.request.user)
        return context


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
        if hasattr(self.object, 'datapivotupload'):
            if format_ == 'excel':
                response = HttpResponse(
                    self.object.excel_file.file.read(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                fn = os.path.basename(self.object.excel_file.name)
            else:
                worksheet_name = self.object.worksheet_name
                if worksheet_name == '':
                    worksheet_name = 0
                response = HttpResponse(
                    pd.read_excel(self.object.excel_file.file, sheet_name=worksheet_name).to_csv(index=False, sep='\t'),
                    content_type='text/tab-separated-values'
                )
                fn = os.path.basename(os.path.basename(self.object.excel_file.name)) + '.tsv'
            response['Content-Disposition'] = f'attachment; filename="{fn}"'
            return response
        elif hasattr(self.object, 'datapivotquery'):
            return self.object.get_dataset(format_)
        else:
            raise Http404()


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
        context.update(getEvidenceProfileContextData(self.object))

        return context

    # This method handles a valid submitted form
    def form_valid(self, form):
        # Set the form instance's cross_stream_conclusions to the JSON-formatted version of the cleaned, combined version of the separate
        # related form fields
        form.instance.cross_stream_conclusions = form.cleaned_data.get("cross_stream_conclusions")

        # Set the object model's hawcuser object to the logged-in user before calling the suer-class's form_valid() method
        form.instance.hawcuser = self.request.user

        # return super().form_valid(form)

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
                order = stream["order"],
                confidence_judgement = json.dumps(stream["confidence_judgement"]),
                outcomes = json.dumps(stream["outcomes"]),
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
                        summary_of_findings = json.dumps(scenario["summary_of_findings"]),
                        studies = json.dumps(scenario["studies"]),
                        confidencefactors_increase = "[]",
                        confidencefactors_decrease = "[]",
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
        context.update(getEvidenceProfileContextData(self.object))

        return context

    # This method handles a valid submitted form
    def form_valid(self, form):
        # Set the form instance's cross_stream_conclusions to the JSON-formatted version of the cleaned, combined version of the separate
        # related form fields
        form.instance.cross_stream_conclusions = form.cleaned_data.get("cross_stream_conclusions")

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
            streamToSave.order = stream["order"]
            streamToSave.confidence_judgement = json.dumps(stream["confidence_judgement"])
            streamToSave.outcomes = json.dumps(stream["outcomes"])

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
                    scenarioToSave.summary_of_findings = json.dumps(scenario["summary_of_findings"])
                    scenarioToSave.studies = json.dumps(scenario["studies"])
                    scenarioToSave.confidencefactors_increase = "[]"
                    scenarioToSave.confidencefactors_decrease = "[]"
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


# This function returns the set of serialized objects that are commonly used as context data for Evidence Profile objects
def getEvidenceProfileContextData(object):
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

    # Initialize the evidenceProfile object to an empty dictionary
    evidenceProfile = {}

    if (object):
        # The incoming object is not empty, create a JSON-friendly version of it, and include an additional attribute for the
        # profile's existing child streams
        evidenceProfile = json.loads(serializers.serialize("json", [object, ]))[0]["fields"]

        # Add a serialized version of the Evidence Profile object's streams to evidenceProfile, and copy the stream's primary key over into its
        # "fields" dictionary for retention in a later step
        streamObjectList = object.streams.all().order_by("order")
        evidenceProfile["streams"] = json.loads(serializers.serialize("json", streamObjectList))
        for stream in evidenceProfile["streams"]:
            stream["fields"]["pk"] = stream["pk"]
            stream["fields"]["scenarios"] = []

        i = 0
        iTo = len(streamObjectList)
        maxStreamIndex = len(evidenceProfile["streams"]) - 1
        while ((i < iTo) and (i <= maxStreamIndex)):
            evidenceProfile["streams"][i]["fields"]["scenarios"] = json.loads(serializers.serialize("json", streamObjectList[i].scenarios.all().order_by("order")))

            for scenario in evidenceProfile["streams"][i]["fields"]["scenarios"]:
                scenario["fields"]["pk"] = scenario["pk"]

            evidenceProfile["streams"][i]["fields"]["scenarios"][:] = [scenario["fields"] for scenario in evidenceProfile["streams"][i]["fields"]["scenarios"] if (scenario)]

            i = i + 1
    else:
        # The incoming object is empty (creating a new object), create a JSON-friendly base model for it, and include an additional
        # attibute for the profile's child streams
        evidenceProfile = json.loads(serializers.serialize("json", [models.EvidenceProfile(), ]))[0]["fields"]
        evidenceProfile["streams"] = []

    # Any existing stream objects loaded from the database will have the actual data fields stored within a "fields" attribute; extract
    # that data from the fields attribute and retain only that portion of the original stream object
    evidenceProfile["streams"][:] = [stream["fields"] for stream in evidenceProfile["streams"] if (stream)]

    #Attempt to de-serialize the profile's "cross_stream_conclusions" attribute
    try:
        evidenceProfile["cross_stream_conclusions"] = json.loads(evidenceProfile["cross_stream_conclusions"])
    except:
        evidenceProfile["cross_stream_conclusions"] = {}

    # Make sure that the profile's cross_stream_conclusions attribute includes a confidence_judgement attribute of its own
    if ("confidence_judgement" not in evidenceProfile["cross_stream_conclusions"]):
        evidenceProfile["cross_stream_conclusions"]["confidence_judgement"] = {
            "score": "",
            "name": "",
            "explanation": "",
        }

    # Make sure that the profile's cross_stream_conclusions attribute includes an inferences attribute of its own
    if ("inferences" not in evidenceProfile["cross_stream_conclusions"]):
        evidenceProfile["cross_stream_conclusions"]["inferences"] = []

    # Attempt to de-serialize each stream's "confidence_judgement" and "outcome" attributes
    for stream in evidenceProfile["streams"]:
        try:
            stream["confidence_judgement"] = json.loads(stream["confidence_judgement"])
        except:
            stream["confidence_judgement"] = {}

        try:
            stream["outcomes"] = json.loads(stream["outcomes"])
        except:
            stream["outcomes"] = []

        # Attempt to iterate through each scenario within this stream and de=serialize their "outcome," "studies," "confidencefactor_increase,"
        # "confidencefactor_decrease" and "summary_of_findings" attributes
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

                try:
                    scenario["confidencefactors_increase"] = json.loads(scenario["confidencefactors_increase"])
                except:
                    scenario["confidencefactors_increase"] = []

                try:
                    scenario["confidencefactors_decrease"] = json.loads(scenario["confidencefactors_decrease"])
                except:
                    scenario["confidencefactors_decrease"] = []

                try:
                    scenario["summary_of_findings"] = json.loads(scenario["summary_of_findings"])
                except:
                    scenario["summary_of_findings"] = {}

    # Serialize the evnidenceProfile into a JSON-formatted string version for inclusion in the request context (the JavaScript in the
    # template will pick up all of the objects and datatypes as desired)
    returnValue["evidenceProfile"] = json.dumps(evidenceProfile)

    return returnValue
