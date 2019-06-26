from django import template

register = template.Library()


# This function displays the incoming confidence judgement and returns it according to the associated template
@register.inclusion_tag("summary/evidenceprofile_confidencejudgement.html")
def evidenceprofile_confidencejudgement(confidenceJudgement:dict, showPips:bool=True):
    # Initialize a list that will hold the "pips" used to visually display the score

    pips = []
    pipColor = "000000"

    if (showPips):
        # This use of the function is intended to show pip, generate the set of pips to be displayed

        # Make sure the incoming confidenceJudgement's score is an integer between 0 and 4
        score = 0

        try:
            score = int(confidenceJudgement["score"])
        except:
            pass

        if (score <= 0):
            pips = [
                '<span class="pipOpen">&#x25EF</span>',
                '<span class="pipOpen">&#x25EF</span>',
                '<span class="pipOpen">&#x25EF</span>',
            ]

            pipColor = "FF0000"

        elif (score == 1):
            pips = [
                '<span class="pipMinus">&#x2296</span>',
                '<span class="pipOpen">&#x25EF</span>',
                '<span class="pipOpen">&#x25EF</span>',
            ]

            pipColor = "FF0000"

        elif (score == 2):
            pips = [
                '<span class="pipPlus">&#x2295</span>',
                '<span class="pipPlus">&#x2295</span>',
                '<span class="pipOpen">&#x25EF</span>',
            ]

        else:
            pips = [
                '<span class="pipPlus">&#x2295</span>',
                '<span class="pipPlus">&#x2295</span>',
                '<span class="pipPlus">&#x2295</span>',
            ]

            pipColor = "00AA00"

        if (score < 0):
            score = 0
        elif (score > 3):
            score = 3

    """
    # Iterate from 0 to (score - 1) and add a solid circle Unicode symbol into pips each time
    for i in range(score):
        pips.append("&#xF111;")

    # Iterate from score to 2 and add an open circle Unicode symbol into pips each time
    for i in range(score, 3):
        pips.append("&#xF10C")
    """

    # Pass the built-up pips and confidenceJudgement into the template
    return {
        "showPips": showPips,
        "pips": pips,
        "pipColor": pipColor,
        "confidenceJudgement": confidenceJudgement,
    }
