from django import template

register = template.Library()


# This function displays the incoming confidence judgement and returns it according to the associated template
@register.inclusion_tag("summary/evidenceprofile_confidencejudgement.html")
def evidenceprofile_confidencejudgement(confidenceJudgement):
    # Initialize a list that will hold the "pips" used to visually display the score
    pips = []

    # Make sure the incoming confidenceJudgement's score is an integer between 0 and 4
    score = 0
    try:
        score = int(confidenceJudgement["score"])
    except:
        pass

    if (score < 0):
        score = 0
    elif (score > 4):
        score = 4

    # Iterate from 0 to (score - 1) and add a solid circle Unicode symbol into pips each time
    for i in range(score):
        pips.append("&#xF111;")

    # Iterate from score to 3 and add an open circle Unicode symbol into pips each time
    for i in range(score, 4):
        pips.append("&#xF10C")

    # Pass the built-up pips and confidenceJudgement into the template
    return {
        "pips": pips,
        "confidenceJudgement": confidenceJudgement,
    }
