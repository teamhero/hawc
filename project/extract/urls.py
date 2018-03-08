from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from . import  views

router = DefaultRouter()

urlpatterns = [

    url(r'^hero/$',
        views.Home.as_view(), name='hero'),
    url(r'^test/$',
        views.Test.as_view(), name='test'),
]
