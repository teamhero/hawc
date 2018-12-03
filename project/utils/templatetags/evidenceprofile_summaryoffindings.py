from django import template

register = template.Library()


# This function takes the incoming summary of findings and returns it to the associated template
@register.inclusion_tag("summary/evidenceprofile_summaryoffindings.html")
def evidenceprofile_summaryoffindings(summaryOfFindings):
    return {
        "summaryOfFindings": summaryOfFindings
    }
