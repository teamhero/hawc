from django import template

register = template.Library()


# This function takes in a list of objects and returns it according to the associated template
@register.inclusion_tag("summary/evidenceprofile_listobjects.html")
def evidenceprofile_listobjects(list):
    return {
        "list": list,
    }
