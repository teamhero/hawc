from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from . import  views

router = DefaultRouter()

urlpatterns = [

    url(r'^hero/(?P<pk>\d+)/$',
        views.Hero.as_view(), name='hero'),
    url(r'^hero/(?P<pk>\d+)/add/$',
        views.HeroAdd.as_view(), name='hero_add'),
    url(r'^tagtree/$',
        views.TagTree.as_view(), name='tagtree'),
    url(r'^project/(?P<pk>\d+)/$',
        views.HeroAdd.as_view(),
        name='hero_project'),
    
]
