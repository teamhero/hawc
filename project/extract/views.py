from django.http import HttpResponse
from django.template import Context, loader
from django.http import HttpRequest
from django.shortcuts import HttpResponse
from lxml import etree
from xml.dom import minidom
from xml.dom.minidom import parse
import urllib.request
import xml.etree.ElementTree as ET
import sys

# Create your views here.

def index(request):
	return HttpResponse("HERO Extracted Code will go here.")


def test(request):

    data={}
    doc = urllib.request.urlopen("http://localhost/hero/index.cfm/content/tagtreexml/")
    #parsed = minidom.parse(doc)
    return HttpResponse(doc)

