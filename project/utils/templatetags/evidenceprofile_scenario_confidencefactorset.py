from django import template

register = template.Library()


@register.inclusion_tag("summary/evidenceprofile_scenario_confidencefactorset.html")
def evidenceprofile_scenario_confidencefactorset(confidenceFactors, studyCount):
    return {
        "confidenceFactors": confidenceFactors,
        "studyCount": studyCount,
    }
