from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from . import  views

router = DefaultRouter()

urlpatterns = [

    url(r'^hero/$',
        views.Home.as_view(), name='hero'),
    url(r'^tagtree/$',
        views.TagTree.as_view(), name='tagtree'),
]
