import $ from '$';
import d3 from 'd3';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

import Library from './Library';
import EvidenceProfileStream from './EvidenceProfileStream';

// This class is intended to hold an Evidence Profile object -- essentially all of the data needed to generate an Evidence Profile report,
// or a form for creating and managing an Evidence Profile
class EvidenceProfile {
    constructor(configuration) {
    	// This constructor is empty, all work happens through static methods
    }

    static configure(configuration) {
    	if (typeof(configuration) == "object") {
    		// The configuration argument is an object, save it for later use
    		EvidenceProfile.configuration = configuration;
    	}
    }

    // This function builds the formset for the "Cross-Stream Inferences" portion of the Evidence Profile form
    static buildCrossStreamInferencesFormset(evidenceProfile) {
        if (typeof(evidenceProfile) == "object") {
            // The incoming evidenceProfile arguments is an object, assume it has the desired attribute(s)

            var $formActions = $("#" + EvidenceProfile.configuration.formId + " ." + EvidenceProfile.configuration.formActionsClass);
            if ($formActions.length > 0) {
                // The form that holds the Evidence Profile exists, and it contains an "actions" (i.e. its "Save" and "Cancel"
                // buttons) element; build the new formset and place it just above the actions

                // This page has the desired form and form element, build the formset to add to the form

                // First, create the new <div> element that will hold the cross-stream inferences
                var newDiv = '<hr />';
                newDiv = newDiv + '<div id="' + EvidenceProfile.configuration.inferencesDivId + '" class="control-label" style="font-size:0.9em; overflow-x:scroll;">';
                newDiv = newDiv + ' <strong class="control-label">Inferences Across Streams</strong>';
                newDiv = newDiv + ' <button id="' + EvidenceProfile.configuration.addInferenceRowId + '" class="btn btn-primary pull-right" type="button">New Inference</button>'
                newDiv = newDiv + ' <table id="' + EvidenceProfile.configuration.inferencesTableId + '" style="width:700px;">';
                newDiv = newDiv + '     <thead>';
                newDiv = newDiv + '         <tr>';
                newDiv = newDiv + '             <th style="border:0; font-size:0.9em; width:29%;">Title</th>';
                newDiv = newDiv + '             <th style="border:0; font-size:0.9em; width:48%;">Explanation</th>';
                newDiv = newDiv + '             <th style="border:0; font-size:0.9em; width:23%;"></th>';
                newDiv = newDiv + '         </tr>';
                newDiv = newDiv + '     </thead>';
                newDiv = newDiv + '     <tbody>';
                newDiv = newDiv + '     </tbody>';
                newDiv = newDiv + ' </table>';
                newDiv = newDiv + '</div>';

                // Now add the newly-built <div> element to the end of the form (just before the form's actions element)
                $formActions.before(newDiv);

                // Now set the click() functionality for the button to add a new inference
                $("#" + EvidenceProfile.configuration.addInferenceRowId).click(
                    function() {
                        EvidenceProfile.createCrossStreamInferenceRow();
                    }
                );

                // Iterate over the existing array of inferences and add each one to the table
                for (var i=0; i<evidenceProfile.cross_stream_conclusions.inferences.length; i++) {
                    EvidenceProfile.createCrossStreamInferenceRow(evidenceProfile.cross_stream_conclusions.inferences[i].title, evidenceProfile.cross_stream_conclusions.inferences[i].explanation);
                }

                // Add <hr /> tag just below the new "div_id_inferences" field in the form
                Library.addHRTag(EvidenceProfile.configuration.inferencesDivId, "after");
            }
        }
    }

    // This function creates a table row for a new Cross-Stream Inference within the Cross-Stream Inferences table in the form
    // This can be used to create either a new, empty inference or add one that already exists within the Evidence Profile
    static createCrossStreamInferenceRow(title="", explanation="") {
        if (((typeof(title) == "string") || (typeof(title) == "number")) && ((typeof(explanation) == "string") || (typeof(explanation) == "number"))) {
            // The incoming arguments match the desired types, continue

            // Get the tbody of the table indicated by the table_id argument
            var $tbody = $("#" + EvidenceProfile.configuration.inferencesTableId + " tbody");
            if ($tbody.length > 0) {
                // The desired table body was found, add a cross-stream inferences row to it

                // Iterate through the existing rows in $tbody to come up with the index and count(i.e. ordering) values to use when creating the
                // next row
                var index = 0;
                var count = 0;
                $tbody.find("tr").each(
                    function(i, row) {
                        var $row = $(row);

                        var id = $row.attr("id");
                        if ((typeof(id) != "undefined") && (id != "") && (id.match(new RegExp(EvidenceProfile.configuration.inferenceRowRegEx.match, "g")))) {
                            // The row object as an id attribute that matches the desired naming convention, retain the numeric portion of it if it
                            // is greater than the exiting index value
                            index = Math.max(index, id.replace(new RegExp(EvidenceProfile.configuration.inferenceRowRegEx.replace, "g"), "$1"));

                            // Increment count
                            count++;
                        }
                    }
                );

                // Increment index and count by one to get the desired next values
                index++;
                count++;

                // Build the <tr> that will be added to the table body
                var tr = '<tr id="' + EvidenceProfile.configuration.inferenceRowIdPrefix + '_' + index + '">';
                tr = tr + ' <td style="border:0; vertical-align:top;">';
                tr = tr + '     <input id="inference_order_' + index + '" class="orderingField" type="hidden" name="inference_order_' + index + '" value="' + count + '" />'
                tr = tr + '     <input id="inference_title_' + index + '" class="span12 textinput textInput" type="text" maxlength="50" name="inference_title_' + index + '" required="required" value="' + title + '" />';
                tr = tr + ' </td>';
                tr = tr + ' <td style="border:0; vertical-align:top;"><textarea id="inference_explanation_' + index + '" class="span12" name="inference_explanation_' + index + '" cols="40" rows="4" required="required">' + explanation + '</textarea></td>';
                tr = tr + ' <td style="border:0; vertical-align:top;">';
                tr = tr + '     <button id="' + EvidenceProfile.configuration.buttonSetBaseId + '_moveup_' + index + '" class="btn btn-mini" title="move up" type="button"><i class="icon-arrow-up" /></button><br />';
                tr = tr + '     <button id="' + EvidenceProfile.configuration.buttonSetBaseId + '_movedown_' + index + '" class="btn btn-mini" title="move down" type="button"><i class="icon-arrow-down" /></button><br />';
                tr = tr + '     <button id="' + EvidenceProfile.configuration.buttonSetBaseId + '_remove_' + index + '" class="btn btn-mini" title="remove" type="button"><i class="icon-remove" /></button><br />';
                tr = tr + ' </td>';
                tr = tr + '</tr>';

                // Append the table row, set the click() functionality for the new buttons,  and then adjust the table's look and
                // variable names as needed
                $tbody.append(tr);

                Library.setButtonSetClickActions(
                    EvidenceProfile.configuration.buttonSetBaseId,
                    EvidenceProfile.configuration.inferenceRowIdPrefix,
                    EvidenceProfile.configuration.inferencesTableId,
                    index
                );

                Library.updateTableRows(EvidenceProfile.configuration.inferencesTableId);
            }
        }
    }

    // This method attempts to check the incoming evidenceProfile object to make sure that it is an object and has a "cross_stream_conclusions" attribute
    // that matches the desired format
    static checkEvidenceProfile(evidenceProfile) {
        var returnValue = {};

        if (typeof(evidenceProfile) == "object") {
            // The incoming evidenceProfile argument is an ojbect, use it for the basis of returnValue
            returnValue = evidenceProfile;

            if (typeof(returnValue["cross_stream_conclusions"]) == "string") {
                // evidenceProfile contains a string attribute named "cross_stream_conclusions," attempt to de-serialize it from JSON

                try {
                    returnValue.cross_stream_conclusions = JSON.parse(returnValue.cross_stream_conclusions);
                }
                catch(error) {
                    // The cross_stream_conclusions attribute was not a valid JSON packet, create an initialized object of the desired format in its
                    // place
                    returnValue["cross_stream_conclusions"] = {
                        "inferences": [],
                        "confidence_judgement": {
                            "rating": null,
                            "explanation": ""
                        }
                    }
                }
            }
            else {
                // evidenceProfile did not contain a string attribute named "cross_stream_conclusions," create an initialized object of the desired
                // format in its place
                returnValue["cross_stream_conclusions"] = {
                    "inferences": [],
                    "confidence_judgement": {
                        "rating": null,
                        "explanation": ""
                    }
                }
            }

            if (typeof(returnValue.cross_stream_conclusions["inferences"]) != "object") {
                // returnValue.cross_stream_conclusions.inferences either does not exist or is not of the desired format, create/replace it
                // with an object of the desired format
                returnValue.cross_stream_conclusions["inferences"] = [];
            }
        }

        return returnValue;
    }
}

export default EvidenceProfile;
