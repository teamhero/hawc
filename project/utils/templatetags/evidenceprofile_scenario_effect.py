from django import template

register = template.Library()


@register.inclusion_tag("summary/evidenceprofile_scenario_effect.html")
def evidenceprofile_scenario_effect(effect):
    return {
        "effect": effect
    }
