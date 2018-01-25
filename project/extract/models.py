import json
import os

from django.db import models

from utils.models import get_crumbs
from utils.helper import HAWCDjangoJSONEncoder
from myuser.models import HAWCUser

# Create your models here.

class extract(models.Model):
	project_id = models