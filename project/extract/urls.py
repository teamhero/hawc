from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from . import  views

router = DefaultRouter()

urlpatterns = [

    url(r'^hero/$',
        views.index, name='hero'),
    url(r'^test/$',
        views.test, name='test'),
]
