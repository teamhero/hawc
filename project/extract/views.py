from django.views.generic.edit import FormView
from django.views.generic import View, ListView, TemplateView, FormView
from django.template import Context, loader
from django.http import HttpRequest, HttpResponseRedirect
from django.shortcuts import HttpResponse, get_object_or_404, render
from django.core import serializers
from django.conf.urls import url, include
from xml.dom import minidom
from xml.dom.minidom import parse
import xml.parsers.expat
import lxml.etree as ET
import urllib.request
import requests
import json
import os.path
import re
from assessment.models import Attachment, Assessment
from utils.models import get_crumbs
from lit.models import Reference, Search, ReferenceFilterTag
from . import models
from .forms import HeroForm


BASE = os.path.dirname(os.path.abspath(__file__))
PROJECT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.join(os.pardir, os.pardir)))
TEMP_PATH = os.path.join(PROJECT_PATH, 'project\\templates')

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
        context['myVar'] = newdom
        return context

class Home(TemplateView):
    template_name = 'extract/index.html'

    def get(*args, **kwargs):
        return HttpResponse("HERO Extracted Code will go here.")

class HeroAdd(TemplateView):
    template_name = 'extract/heroadd.html'
    heroURL = "http://localhost/hero/index.cfm/api/1.0/referencetagger/getprojecttagtree"
    apiToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3N1ZXJfcGVyc29uX2lkIjoyMjY3LCJpc3N1ZXJfb3JnYW5pemF0aW9uX2lkIjoyNzI5LCJpc3N1ZV9kYXRlIjoiRGVjZW1iZXIsIDIwIDIwMTcgMTU6Mzk6MTUiLCJpc3N1ZWVfb3JnYW5pemF0aW9uX2lkIjoxMDUsImlzc3VlZV9wZXJzb25faWQiOjE1MDh9.qeq4QmAE5SDw5c82UPm51ucjfE3DyOz9X_Wlv91aXtQ"
    #model = models.Attachment
    parent_model = Assessment
    model = Search
    def __init__(self, **kwargs):
        response = requests.post(
            self.heroURL
            ,headers = {
                "Authorization": "Bearer " + self.apiToken
            }
        )

    def get_object(self, **kwargs):
        return get_object_or_404(Assessment, pk=self.kwargs.get('pk'))

    def get_crumbs(self):
        return get_crumbs(self)

    def post(self, request, *args, **kwargs):
        assessment_id = self.kwargs.get('pk')
        project_id = request.POST.get('heroproject')
        thisObject = self.get_object()
        response = requests.post(
            self.heroURL
            ,data = '{"project_id":' + project_id + '}'
            ,headers = {
                "Authorization": "Bearer " + self.apiToken
                ,"Content-Type": "application/json"
            }
        )
        #print(request.POST.get('heroproject'))
        print(self.kwargs.get('pk'))
        myVar = response.text
        tempVar = json.loads(myVar)
        myVar2 = tempVar["methodResult"]["tagTree"]
        tempString = ''
        count1 = 0
        if len(myVar2["children"]) > 0:
            tempString = tempString + ', {"data": {"name": "HERO Tags", "slug": "hero-tags"}, "id": ' + project_id + ', "children": ['
            for key in myVar2["children"]:
                print(key["usage"])
                usage1 = str(key["usage"])
                usageID1 = str(key["usage_id"])
                level1 = str(key["level"] + 1)
                slug1 =  re.sub(" ", "-", usage1, 0, re.MULTILINE).lower()
                tempString = tempString + '{"data": {"name": "' + usage1 + '", "slug": "' + slug1 + '"}, "id": ' + usageID1
                if len(key["children"]) > 0:
                    tempString = tempString + ', "children": ['
                    for key2 in key["children"]:
                        print(key2["usage"])
                        usage2 = str(key2["usage"])
                        usageID2 = str(key2["usage_id"])
                        level2 = str(key2["level"] + 1)
                        slug2 =  re.sub(" ", "-", usage2, 0, re.MULTILINE).lower()
                        tempString = tempString + '{"data": {"name": "' + usage2 + '", "slug": "' + slug2 + '"}, "id": ' + usageID2
                        if len(key2["children"]) > 0:
                            tempString = tempString + ', "children": ['
                            for key3 in key2["children"]:
                                print(key3["usage"])
                                usage3 = str(key3["usage"])
                                usageID3 = str(key3["usage_id"])
                                level3 = str(key3["level"] + 1)
                                slug3 =  re.sub(" ", "-", usage3, 0, re.MULTILINE).lower()
                                tempString = tempString + '{"data": {"name": "' + usage3 + '", "slug": "' + slug3 + '"}, "id": ' + usageID3
                                if len(key3["children"]) > 0:
                                    tempString = tempString + ', "children": ['
                                    for key4 in key3["children"]:
                                        print(key4["usage"])
                                        usage4 = str(key4["usage"])
                                        usageID4 = str(key4["usage_id"])
                                        level4 = str(key4["level"] + 1)
                                        slug4 =  re.sub(" ", "-", usage4, 0, re.MULTILINE).lower()
                                        tempString = tempString + '{"data": {"name": "' + usage4 + '", "slug": "' + slug4 + '"}, "id": ' + usageID4 + '}'
                                    tempString = tempString + ']'
                                # else:
                                #     tempString = tempString + ', '
                            tempString = tempString + '}]}, '
                        # else:
                        #     tempString = tempString + ', '
                    tempString = tempString + '}]}, '
                # else:
                #     tempString = tempString + ', '
            tempString = tempString + '}]'


        #     count1 = count1 + 1
        #     if count1 == 1:
        #         tempString = tempString + ', {"data": {"name": "HERO Tags", "slug": "hero-tags"}, "id": ' + project_id + ', "children": [{"data": '
        #     slug1 =  re.sub(" ", "-", usage1, 0, re.MULTILINE).lower()
        #     tempString = tempString + '{"name": "' + usage1 + '", "slug": "' + slug1 + '"}, "id": ' + usageID1 + '}'
                # for key2 in myVar2[key][count1]:
                #     count2 = 0
                #     if key2 == "children":
                #         usage2 = str(myVar2[key][count1][key2][count2]["usage"])
                #         usageID2 = str(myVar2[key][count1][key2][count2]["usage_id"])
                #         count2 = count2 + 1
                #         if count1 == 2:
                #             tempString = tempString + ', "children": [{"data": '
                #         slug2 =  re.sub(" ", "-", usage2, 0, re.MULTILINE).lower()
                #         tempString = tempString + '{"name": "' + usage2 + '", "slug": "' + slug2 + '"}, "id": ' + usageID2 + '}'
        #tempString = tempString + ']'

        print(tempString)

        #The variable 'tags' Grabs the default Tag Tree
        tags = ReferenceFilterTag.get_all_tags(self.kwargs.get('pk'))

        #Here we add the HERO tags into the generated HAWC tags with the variable 'newTags'
        newCount = len(tags) - 3
        newTags = (tags[:newCount] + tempString + '}]}]')

        #Here we send everything we need to the view
        context = {'project_id': project_id, 'object': thisObject, 'assessment_id': self.kwargs.get('pk'), 'myVar': myVar, 'myVar2': myVar2, 'tags': newTags, 'tempString': tags,}
        return render(request, self.template_name, context)

class Hero(TemplateView):
    template_name = 'extract/hero.html'
    heroURL = "http://localhost/hero/index.cfm/api/1.0/referencetagger/getprojects"
    apiToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3N1ZXJfcGVyc29uX2lkIjoyMjY3LCJpc3N1ZXJfb3JnYW5pemF0aW9uX2lkIjoyNzI5LCJpc3N1ZV9kYXRlIjoiQXByaWwsIDEyIDIwMTggMTc6MDg6MTgiLCJpc3N1ZWVfb3JnYW5pemF0aW9uX2lkIjoxMDg2LCJpc3N1ZWVfcGVyc29uX2lkIjoxODcyfQ.U3Njg7P5b3W0jx8BSec9-t1dPmgMKKVVVGLlP5hF3HE"
    model = models.Attachment
    parent_model = Assessment
    formAction = "add"
    def __init__(self, **kwargs):
        response = requests.post(
            self.heroURL
            ,headers = {
                "Authorization": "Bearer " + self.apiToken
            }
        )

    def get_object(self, **kwargs):
        return get_object_or_404(Assessment, pk=self.kwargs.get('pk'))

    def get_crumbs(self):
        return get_crumbs(self)

    def get_context_data(self, *args, **kwargs):
        response = requests.post(
            self.heroURL
            ,headers = {
                "Authorization": "Bearer " + self.apiToken
            }
        )
        context = super().get_context_data(**kwargs)
        context['assessment_id'] = self.kwargs.get('pk')
        context['object'] = self.get_object()
        #context['myVar'] = json.dumps(json.loads(response.text), indent=4)
        context['data'] = json.loads(response.text)

        thisData = json.loads(response.text)
        context['closer'] = thisData["methodResult"]

        thisSet = thisData["methodResult"]["categories"][0]["projects"]
        thisSet.append(thisData["methodResult"]["categories"][1]["projects"])
        thisSet.append(thisData["methodResult"]["categories"][2]["projects"])
        thisSet.append(thisData["methodResult"]["categories"][3]["projects"])
        thisSet.append(thisData["methodResult"]["categories"][4]["projects"])
        regex = r"'"
        subst = "\""
        regexStart = r"[{"
        subStart = "{"
        regexEnd = r"],"
        substEnd = ""
        result = re.sub(regex, subst, str(thisSet), 0, re.MULTILINE)
        result0 = re.sub("\\[", "", str(result), 0, re.MULTILINE)
        resultb = re.sub("\\]", "", str(result0), 0, re.MULTILINE)
        result1 = re.sub('"-', '\'\'-', str(resultb), 0, re.MULTILINE)
        result2 = re.sub('"s ', '\'s ', str(result1), 0, re.MULTILINE)
        result3 = re.sub('\\\\xa0', '', str(result2), 0, re.MULTILINE)
        result4 = "[" + result3 + "]"
        
        context['maybe'] = json.loads(result4)
        context['formAction'] = self.formAction
        return context

if (__name__ == "__main__"):
    test_object()