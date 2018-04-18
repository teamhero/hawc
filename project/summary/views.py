import json

from django.core.urlresolvers import reverse_lazy
from django.http import HttpResponse, Http404, HttpResponseRedirect, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404
from django.views.generic import TemplateView, FormView

from assessment.models import Assessment
from riskofbias.models import RiskOfBiasMetric
from utils.helper import HAWCDjangoJSONEncoder
from utils.views import (BaseList, BaseCreate, BaseDetail, BaseUpdate, BaseDelete, TeamMemberOrHigherMixin)

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
    formset_factory = forms.CrossStreamInferencesFormset

    # This method returns the URL that the requestor will be re-directed to after this request is handled
    def get_success_url(self):
        """
        # Not sure why this is called, other than the fact that it is called in other get_success_url() functions I have seen; the resulting
        # object returned is not used or even retained; it is a good candidate for removal
        super().get_success_url()
        """

        # Get the value for this Evidence Profile's visualization URL and return it
        return self.object.get_visualization_update_url()

    # This method gets the keyword arguments (kwargs) from a form
    def get_form_kwargs(self):
        # Call the superclass's get_form_kwargs() to get the basic set of keyword arguments
        kwargs = super().get_form_kwargs()

        if self.request.GET.get('reset_row_overrides'):
            # This request has an HTTP GET parameter named 'reset_row_overrides', set the kwargs['initial']['settings'] (making sure it is
            # a JSON object with the desired format)
            kwargs['initial']['settings'] = models.EvidenceProfile.reset_row_overrides(kwargs['initial']['settings'])

        return kwargs

    # This function sets the basic "context data" for this view
    def get_context_data(self, **kwargs):
        # Call the superclass's get_cotext_data() method and set the resulting object's "file_loader" attribute to FALSE
        context = super().get_context_data(**kwargs)
        context['file_loader'] = False

        # Set a "smart_tag_form" attribute for this view
        context['smart_tag_form'] = forms.SmartTagForm(assessment_id=self.assessment.id)

        return context

    # This method handles a valid submitted form
    def form_valid(self, form):
        # Set the object model's cross_stream_conclusions to the JSON-formatted version of the cleaned, combined version of the separate
        # form fields
        form.instance.cross_stream_conclusions = json.dumps(form.cleaned_data.get("cross_stream_conclusions"))

        # Set the object model's hawcuser object to the logged-in user before calling the suer-class's form_valid() method
        form.instance.hawcuser = self.request.user

        return super().form_valid(form)


class EvidenceProfileUpdateSettings(GetEvidenceProfileObjectMixin, BaseUpdate):
    success_message = 'Evidence Profile updated.'
    model = models.EvidenceProfile
    form_class = forms.EvidenceProfileForm
    formset_factory = forms.CrossStreamInferencesFormset
    template_name = 'summary/evidenceprofile_form.html'


class EvidenceProfileDetail(GetEvidenceProfileObjectMixin, BaseDetail):
    model = models.EvidenceProfile
    template_name = "summary/evidenceprofile_detail.html"


class EvidenceProfileData(GetEvidenceProfileObjectMixin, BaseDetail):
    model = models.EvidenceProfile

    def get_export_format(self):
        format_ = self.request.GET.get("format", "excel")
        if format_ not in ["tsv", "excel"]:
            raise Http404()
        return format_

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        format_ = self.get_export_format()
        return self.object.get_dataset(format_)
