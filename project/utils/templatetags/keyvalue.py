from django import template

register = template.Library()


@register.filter
def keyvalue(dict, value):
	return dict[value] if (value in dict) else ""
