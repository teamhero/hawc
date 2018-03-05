from django.http import HttpResponse
from django.http import JsonResponse
from django.template import Context, loader
from django.http import HttpRequest
from django.shortcuts import HttpResponse
from django.core import serializers
from xml.dom import minidom
from xml.dom.minidom import parse
import xml.parsers.expat
import lxml.etree as ET
import urllib.request
import sys
import json
import os.path
BASE = os.path.dirname(os.path.abspath(__file__))

# Create your views here.

def index(request):
	return HttpResponse("HERO Extracted Code will go here.")

def test(request):

    data = open(os.path.join(BASE, "checkboxtree.xslt"), encoding="utf8")
    doc = urllib.request.urlopen("http://localhost/hero/index.cfm/content/tagtreexml/")
    dom = ET.parse(doc)
    xslt = ET.parse(data)
    transform = ET.XSLT(xslt)
    newdom = transform(dom)
    print(ET.tostring(newdom, pretty_print=True))
    #return HttpResponse(doc, content_type='text/xml')