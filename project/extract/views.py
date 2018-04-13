from django.shortcuts import get_object_or_404
from django.views.generic.edit import FormView
from django.views.generic import View, ListView, TemplateView, FormView
from django.template import Context, loader
from django.http import HttpRequest
from django.shortcuts import HttpResponse
from django.shortcuts import render
from django.core import serializers
from xml.dom import minidom
from xml.dom.minidom import parse
import xml.parsers.expat
import lxml.etree as ET
import urllib.request
import sys
import requests
import json
import os.path
from . import models

BASE = os.path.dirname(os.path.abspath(__file__))

# Create your views here.

class TagTree(TemplateView):
    template_name = 'extract/index.html'

    def get_context_data(self, **kwargs):
        data = open(os.path.join(BASE, "checkboxtree.xslt"), encoding="utf8")
        doc = urllib.request.urlopen("http://localhost/hero/index.cfm/content/tagtreexml/")
        #doc2 = open(os.path.join(BASE, "hawc.xml"), encoding="utf8")
        dom = ET.parse(doc)
        xslt = ET.parse(data)
        transform = ET.XSLT(xslt)
        newdom = transform(dom)
        context = super().get_context_data(**kwargs)
        #print(ET.tostring(dom,pretty_print=True))
        #context['myVar'] = ET.tostring(newdom, pretty_print=True)
        context['myVar'] = newdom
        return context

class Home(TemplateView):
    template_name = 'extract/index.html'

    def get(*args, **kwargs):
        return HttpResponse("HERO Extracted Code will go here.")

class Hero(TemplateView):
    template_name = 'extract/hero.html'
    heroURL = "http://localhost/hero/index.cfm/api/1.0/referencetagger/getprojects"
    apiToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3N1ZXJfcGVyc29uX2lkIjoyMjY3LCJpc3N1ZXJfb3JnYW5pemF0aW9uX2lkIjoyNzI5LCJpc3N1ZV9kYXRlIjoiQXByaWwsIDEyIDIwMTggMTc6MDg6MTgiLCJpc3N1ZWVfb3JnYW5pemF0aW9uX2lkIjoxMDg2LCJpc3N1ZWVfcGVyc29uX2lkIjoxODcyfQ.U3Njg7P5b3W0jx8BSec9-t1dPmgMKKVVVGLlP5hF3HE"

    def __init__(self):
        response = requests.post(
            self.heroURL
            ,headers = {
                "Authorization": "Bearer " + self.apiToken
            }
        )

        print(json.dumps(json.loads(response.text), indent=4))

    def get_context_data(self, **kwargs):
        response = requests.post(
            self.heroURL
            ,headers = {
                "Authorization": "Bearer " + self.apiToken
            }
        )
        context = super().get_context_data(**kwargs)
        context['myVar'] = json.dumps(json.loads(response.text), indent=4)
        return context

if (__name__ == "__main__"):
    test_object()