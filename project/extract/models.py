import json
import os

from django.db import models

from utils.models import get_crumbs
from utils.helper import HAWCDjangoJSONEncoder
from myuser.models import HAWCUser

# Create your models here.

class extract(models.Model):
	project_id = models


class Category(models.Model):
    category_id = models.IntegerField(default=0)
    category_name = models.CharField(max_length=200)

class Project(models.Model):
    project_id = models.ForeignKey(Category, on_delete=models.CASCADE)
    projectName = models.CharField(max_length=200)
    projectAbbr = models.CharField(max_length=200)
    casrn = models.CharField(max_length=200)

class Usages(models.Model):
	usage_id = models.ForeignKey(Usages, on_delete=models.CASCADE)
	usage_level = models.IntegerField(default=0)
    usage_name = models.CharField(max_length=200)
    usage_group = models.CharField(max_length=200)
