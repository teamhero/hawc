from django import forms
from django.core.urlresolvers import reverse
from django.forms import ModelForm
from django.forms.models import BaseModelFormSet, modelformset_factory
from django.db.models import Q

from . import models
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class ExtractProject(ModelForm):

    class Meta:
        model = models.Project
        exclude = ('project_id', )

class HeroForm(forms.Form):
    heroproject = forms.CharField(label='Hero Projects', max_length=100)
