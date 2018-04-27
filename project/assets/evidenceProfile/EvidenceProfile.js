import $ from '$';
import d3 from 'd3';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

import EvidenceProfileStream from './EvidenceProfileStream';

// This class is intended to hold an Evidence Profile object -- essentially all of the data needed to generate an Evidence Profile report,
// or a form for creating and managing an Evidence Profile
class EvidenceProfile {
    constructor(configuration) {
    	// This constructor is empty, all work happens through static methods
    }

    static configure(configuration) {
    	console.log("In EvidenceProfile.configure()");
    	if (typeof(configuration) == "object") {
    		// The configuration argument is an object, save it for later use
    		this.configuration = configuration;
    	}
    }

    // This function builds the formset for the "Cross-Stream Inferences" portion of the Evidence Profile form
    static buildCrossStreamInferencesFormset(cross_stream_conclusions) {
        if ((typeof(form_id) == "string") && (form_id != "")) {
            // The incoming form_id argument is a non-empty string, try to build the formset

            // Try to retireve the form element intended to hold the form's actions (i.e. "Save" and "Cancel" buttons)
            var $formActions = $("#" + form_id + " .form-actions");
            if ($formActions.length > 0) {
                // This page has the desired form and form element, build the formset to add to the form

                // First, create the new <div> element that will hold the cross-stream inferences
                var newDiv = '<hr />';
                newDiv = newDiv + '<div id="div_id_inferences" class="control-label" style="font-size:0.9em; overflow-x:scroll;">';
                newDiv = newDiv + ' <strong class="control-label">Inferences Across Streams</strong>';
                newDiv = newDiv + ' <button id="add_inference_row" class="btn btn-primary pull-right" type="button">New Inference</button>'
                newDiv = newDiv + ' <table id="table_id_inferences" style="width:700px;">';
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
                $("#add_inference_row").click(
                    function() {
                        EvidenceProfile.createCrossStreamInferenceRow("table_id_inferences");
                    }
                );

                if ((typeof(cross_stream_conclusions) == "object") && (typeof(cross_stream_conclusions.inferences) == "object") && (cross_stream_conclusions.inferences.length > 0)) {
                    // The existing EvidenceProfile object has a set of cross-stream inferences, iterate over the array and add each one to the table
                    for (var i=0; i<cross_stream_conclusions.inferences.length; i++) {
                        EvidenceProfile.createCrossStreamInferenceRow("table_id_inferences", cross_stream_conclusions.inferences[i].title, cross_stream_conclusions.inferences[i].explanation);
                    }
                }

                // Add <hr /> tag just below the new "div_id_inferences" field in the form
                EvidenceProfile.addHRTag("div_id_inferences", "after");
            }
        }
    }

    // This function creates a table row for a new Cross-Stream Inference within the Cross-Stream Inferences table in the form
    // This can be used to create either a new, empty inference or add one that already exists within the Evidence Profile
    static createCrossStreamInferenceRow(table_id, title="", explanation="") {
        if (
            (typeof(table_id) == "string")
            && (table_id != "")
            && ((typeof(title) == "string") || (typeof(title) == "number"))
            && ((typeof(explanation) == "string") || (typeof(explanation) == "number"))
        ) {
            // The incoming arguments match the desired types, and the table_id is not empty, continue

            // Get the tbody of the table indicated by the table_id argument
            var $tbody = $("#" + table_id + " tbody");
            if ($tbody.length > 0) {
                // The desired table body was found, add a cross-stream inferences row to it

                // Iterate through the existing rows in $tbody to come up with the index value to use when creating the next row
                var index = 0;
                $tbody.find("tr").each(
                    function(i, row) {
                        var $row = $(row);

                        var id = $row.attr("id");
                        if ((typeof(id) != "undefined") && (id != "") && (id.match(/^row_id_inferences_\d+$/))) {
                            // The row object as an id attribute that matches the desired naming convention, retain the numeric
                            // portion if it is greater than the exiting index value
                            index = Math.max(index, id.replace(/^row_id_inferences_(\d+)$/, "$1"));
                        }
                    }
                );

                // Increment index by one to get the next value
                index++;

                // Build the <tr> that will be added to the table body
                var tr = '<tr id="row_id_inferences_' + index + '">';
                tr = tr + ' <td style="border:0; vertical-align:top;"><input id="inference_title_' + index + '" class="span12 textinput textInput" type="text" maxlength="50" name="inference_title_' + index + '" required="required" value="' + title + '" /></td>';
                tr = tr + ' <td style="border:0; vertical-align:top;"><textarea id="inference_explanation_' + index + '" class="span12" name="inference_explanation_' + index + '" cols="40" rows="4" required="required">' + explanation + '</textarea></td>';
                tr = tr + ' <td style="border:0; vertical-align:top;">';
                tr = tr + '     <button id="btn_inferences_moveup_' + index + '" class="btn btn-mini" title="move up" type="button"><i class="icon-arrow-up" /></button><br />';
                tr = tr + '     <button id="btn_inferences_movedown_' + index + '" class="btn btn-mini" title="move down" type="button"><i class="icon-arrow-down" /></button><br />';
                tr = tr + '     <button id="btn_inferences_remove_' + index + '" class="btn btn-mini" title="remove" type="button"><i class="icon-remove" /></button><br />';
                tr = tr + ' </td>';
                tr = tr + '</tr>';

                // Append the table row, set the click() functionality for the new buttons,  and then adjust the table's look and
                // variable names as needed
                $tbody.append(tr);
                EvidenceProfile.setButtonSetClickActions("inferences", index, EvidenceProfile.updateCrossStreamInferencesTable);
                EvidenceProfile.updateCrossStreamInferencesTable();
            }
        }
    }
}

export default EvidenceProfile;
