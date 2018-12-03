from django import template

register = template.Library()


# This fuction attempts to return the associated value for the specified key
@register.filter
def keyvalue(dict, key):
	return dict[key] if (key in dict) else ""
