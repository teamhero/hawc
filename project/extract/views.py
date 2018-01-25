from django.shortcuts import HttpResponse
from xml.dom import minidom
from xml.dom.minidom import parse
import urllib.request
# Create your views here.

def index(request):
	return HttpResponse("HERO Extracted Code will go here.")


def test(request):

    data={}
    doc = urllib.request.urlopen("http://localhost/shero/index.cfm/admin/viewcachedobject/objectKey/TAGTREEXML")
    docHead = '<?xml version="1.0" encoding="UTF-8"?>'
    docXML = "%s %s" % (doc,docHead);
    #parsed = minidom.parse(docXML)
    return HttpResponse(doc)