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

# def test(request):

#     data = open(os.path.join(BASE, "checkboxtree.xslt"), encoding="utf8")
#     template_name = 'extract/index.html'	
#     doc = urllib.request.urlopen("http://localhost/hero/index.cfm/content/tagtreexml/")
#     dom = ET.parse(doc)
#     xslt = ET.parse(data)
#     transform = ET.XSLT(xslt)
#     newdom = transform(dom)

#     #print(ET.tostring(newdom, pretty_print=True))
#     #return render(request, ET.tostring(newdom, pretty_print=True))
#     #return HttpResponse(ET.tostring(newdom, pretty_print=True))
#     return HttpResponse(newdom)
#     #return HttpResponse(doc, content_type='text/xml')