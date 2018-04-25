import $ from '$';
import d3 from 'd3';

import {saveAs} from 'filesaver.js';

import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

class EvidenceProfile {
    constructor() {
        // There is nothing in this constructor, it is just a placeholder for a set of static functions
    }

    // This function adds an <hr /> tag either above or below the form field named in the fieldName argument
    static addHRTag(fieldName, position) {
        if ((typeof(fieldName) == "string") && (fieldName != "") && (typeof(position) == "string") && (position != "")) {
            // Both incoming arguments are non-empty strings, continue

            // First, look for an element with an ID matching fieldName
            var $fieldDiv = $("#" + fieldName);
            if ($fieldDiv.length == 0) {
                // No matching element was found, look for one with a 'div_id_' in front of it
                $fieldDiv = $("#div_id_" + fieldName);
            }

            if ($fieldDiv.length > 0) {
                // The specified form field's <div> container was found, add the <hr /> tag

                if (position.toLowerCase() != "before") {
                    // By default, place the <hr /> after the specified field
                    $fieldDiv.after('<hr style="margin-top:32px; height:1px;" />');
                }
                else {
                    $fieldDiv.before('<hr style="margin-top:32px; height:1px;" />');
                }
            }
        }
    }

    // This function builds the formset for the "Evidence Profile Streams" portion of the Evidence Profile form
    static buildStreamFormset(form_id, streams) {
        if ((typeof(form_id) == "string") && (form_id != "")) {
            // The incoming form_id argument is a non-empty string, try to build the formset

            // Try to retireve the form element intended to hold the Evidence Profile's caption (the streams formset will be
            // added after the caption)
            var $captionField = $("#" + form_id + " #div_id_caption");
            if ($captionField.length > 0) {
                // This page has the desired form and form element, build the formset to add to the form

                // First, create the new <div> element that will hold the streams
                var newDiv = '';
                newDiv = newDiv + '<div id="div_id_streams" class="control-label" style="font-size:0.9em; overflow-x:scroll;">';
                newDiv = newDiv + ' <strong class="control-label">Evidence Streams</strong>';
                newDiv = newDiv + ' <button id="add_stream_row" class="btn btn-primary pull-right" type="button">New Evidence Stream</button>';
                newDiv = newDiv + ' <table id="table_id_streams" style="width:700px;">';
                newDiv = newDiv + '     <thead>';
                newDiv = newDiv + '      <tr>';
                newDiv = newDiv + '             <th style="border:0; width:90%;">Type</th>';
                newDiv = newDiv + '             <th style="border:0; width:10%;"></th>';
                newDiv = newDiv + '      </tr>'
                newDiv = newDiv + '     <thead>';
                newDiv = newDiv + '     <tbody>';
                newDiv = newDiv + '     </tbody>';
                newDiv = newDiv + ' </table>';
                newDiv = newDiv + '</div>';

                // Now add the newly-built <div> element to the end of the form (just before the form's actions element)
                $captionField.after(newDiv);

                // Now set the click() functionality for the button to add a new stream
                $("#add_stream_row").click(
                    function() {
                        EvidenceProfile.createStreamRow("table_id_streams");
                    }
                );

                // Add an <hr /> tag just below the "div_id_streams" field in the form
                EvidenceProfile.addHRTag("div_id_streams", "after");
            }
        }
    }

    // This function builds the formset for the "Cross-Stream Inferences" portion of the Evidence Profile form
    static buildCrossStreamInferencesFormset(form_id, cross_stream_conclusions) {
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

    // This function creates a table row for a new Evidence Profile Stream within the Streams table in the form
    // This can be used to either create a new, empty stream, or add one that already exists within the Evidence Profile
    static createStreamRow(table_id, stream={}) {
        if ((typeof(table_id) == "string") && (table_id != "") && (typeof(stream) == "object") && (typeof(streamTypes) == "object") && (typeof(streamTypeValues) == "object")) {
            // The incoming arguments match the desired types, the table_id is not empty and the global objects streamTypes and streamTypeValues
            // exist, continue

            // Get the tbody of the table indicated by the table_id argument
            var $tbody = $("#" + table_id + " tbody");
            if ($tbody.length > 0) {
                // The desired table body was found, add a cross-stream inferences row to it

                // Iterate through the existing rows in $tbody to come up with the index value to use when creating the next row
                var index = 0;
                var count = 0;
                $tbody.find("tr").each(
                    function(i, row) {
                        var $row = $(row);

                        var id = $row.attr("id");
                        if ((typeof(id) != "undefined") && (id != "") && (id.match(/^row_id_stream_\d+$/))) {
                            // The row object as an id attribute that matches the desired naming convention, retain the numeric
                            // portion if it is greater than the exiting index value
                            // Also, increment count by one to keep track of the number of valid rows found
                            index = Math.max(index, id.replace(/^row_id_stream_(\d+)$/, "$1"));
                            count++;
                        }
                    }
                );

                // Increment index and count by one to get the next values
                index++;
                count++;

                // Set the initial stream_type value based on the incoming stream object (defaulting to -1)
                var stream_type = (("stream_type" in stream) && (typeof(stream.stream_type) == "number") && (streamTypeValues.includes(stream.stream_type))) ? stream.stream_type : -1;

                var tr = '';
                tr = tr + '<tr id="row_id_stream_' + index + '">';
                tr = tr + ' <td style="border:0; vertical-align:top;">';
                tr = tr + '     <input type="hidden" id="stream_order_' + index + '" name="stream_order_' + index + '" value="' + count + '" />';
                tr = tr + '     <select id="stream_type_' + index + '" name="stream_type_' + index + '">';
                tr = tr + '         <option ' + ((stream_type == -1) ? 'selected="selected" ' : '') + 'value="">--- Select Type ---</option>'

                for (var i=0; i<streamTypes.length; i++) {
                    tr = tr + '         <option ' + ((stream_type == streamTypes[i].value) ? 'selected="selected" ' : '') + 'value="' + streamTypes[i].value + '">' + streamTypes[i].name + '</option>';
                }

                tr = tr + '     </select>';
                tr = tr + ' </td>';
                tr = tr + ' <td style="border:0; vertical-align:top;">';
                tr = tr + '     <button id="btn_inferences_moveup_' + index + '" class="btn btn-mini" title="move up" type="button"><i class="icon-arrow-up" /></button><br />';
                tr = tr + '     <button id="btn_inferences_movedown_' + index + '" class="btn btn-mini" title="move down" type="button"><i class="icon-arrow-down" /></button><br />';
                tr = tr + '     <button id="btn_inferences_remove_' + index + '" class="btn btn-mini" title="remove" type="button"><i class="icon-remove" /></button><br />';
                tr = tr + ' </td>';
                tr = tr + '</tr>';

                // Append the table row, set the click() functionality for the new buttons,  and then adjust the table's look and
                // variable names as needed
                $tbody.append(tr);
                /*
                EvidenceProfile.setCrossStreamButtonClicks(index);
                EvidenceProfile.updateCrossStreamInferencesTable();
                */
            }
        }
    }


    // This function sets the click() functionality for the "Move Up", "Move Down" and "Remove" buttons for an Envidence Profile Stream
    static setStreamButtonClicks(index) {
    }

    // This function creates a table row for a new Cross-Stream Inference within the Cross-Stream Inferences table in the form
    // This can be used to create either a new, empty inference or add one that already exists within the Evidence Profile
    static createCrossStreamInferenceRow(table_id, title="", explanation="") {
        if ((typeof(table_id) == "string") && (table_id != "") && (typeof(title) == "string") && (typeof(explanation) == "string")) {
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

    // This function sets the click() functionality for the "Move Up", "Move Down" and "Remove" set of buttons
    static setButtonSetClickActions(buttonSetBaseName="", index=0, updateFunction) {
        if ((typeof(buttonSetBaseName) == "string") && (buttonSetBaseName != "") && (typeof(index) == "number")) {
            // The buttonSet argument is a non-emtpy string and the index argument is numeric, continue

            var executeUpdateFunction = (typeof(updateFunction) == "function");

            index = Math.floor(index);
            if (index > 0) {
                // The index argument is (now) an integer and is greater than zero, continue

                var $button = $();

                // Try to add the click() functionality for the target "Move Up" button
                $button = $("#btn_" + buttonSetBaseName + "_moveup_" + index);
                if ($button.length > 0) {
                    // The desired "Move Up" button was found, set its click() functionality

                    $button.click(
                        function(e) {
                            var id = $(this).attr("id");
                            if ((typeof(id) != "undefined") && (id != "") && (id.match(new RegExp("^btn_" + buttonSetBaseName + "_moveup_\\\d+$", "g")))) {
                                // The clicked-on element has an id attribute whose value matches the desired naming convention, work with it

                                var $row = $("#row_id_" + buttonSetBaseName + "_" + id.replace(new RegExp("^btn_" + buttonSetBaseName + "_moveup_(\\\d+)$", "g"), "$1"));
                                if ($row.length > 0) {
                                    // The desired table row element was retrieved, see if it has an immediate previous sibling

                                    var $previous = $row.prev();
                                    if ($previous.length > 0) {
                                        // A previous sibling was found, swap the positions of the two and adjust the table shading
                                        $row.after($previous);

                                        if (executeUpdateFunction) {
                                            // An "update" function was passed in, execute it
                                            updateFunction();
                                        }
                                    }
                                }
                            }
                        }
                    );
                }

                /*
                // Try to add the click() functionality for the target "Move Down" button
                $button = $("#btn_inferences_movedown_" + index);
                if ($button.length > 0) {
                    // The button was found, set its click() functionality

                    $("#btn_inferences_movedown_" + index).click(
                        function(e) {
                            var id = $(this).attr("id");
                            if ((typeof(id) != "undefined") && (id != "") && (id.match(/^btn_inferences_movedown_\d+$/))) {
                                // The clicked-on element has an id attribute whose value matches the desired naming convention, work with it

                                var $row = $("#row_id_inferences_" + id.replace(/btn_inferences_movedown_(\d)+$/, "$1"));
                                if ($row.length > 0) {
                                    // The desired table row element was retrieved, see if it has an immediate next sibling

                                    var $next = $row.next();
                                    if ($next.length > 0) {
                                        // A next sibling was found, swap the positions of the two and adjust the table shading
                                        $next.after($row);
                                        EvidenceProfile.updateCrossStreamInferencesTable();
                                    }
                                }
                            }
                        }
                    );
                }

                // Try to add the click() functionality for the target "Move Remove" button
                $button = $("#btn_inferences_remove_" + index);
                if ($button.length > 0) {
                    // The button was found, set its click() functionality

                    $("#btn_inferences_remove_" + index).click(
                        function(e) {
                            var id = $(this).attr("id");
                            if ((typeof(id) != "undefined") && (id != "") && (id.match(/^btn_inferences_remove_\d+$/))) {
                                // The clicked-on element has an id attribute whose value matches the desired naming convention, work with it

                                var $row = $("#row_id_inferences_" + id.replace(/btn_inferences_remove_(\d)+$/, "$1"));
                                if ($row.length > 0) {
                                    // The desired table row element was retrieved, remove it and adjust the table shading
                                    $row.remove();
                                    EvidenceProfile.updateCrossStreamInferencesTable();
                                }
                            }
                        }
                    );
                }
                */
            }
        }
    }

    // This function sets the numbering and shading for the table holding the Cross-Stream Inferences
    static updateCrossStreamInferencesTable() {
        $("#table_id_inferences tbody").find("tr").each(
            function(i, row) {
                $(row).find("input,textarea").each(
                    function(j, field) {
                        $(field).attr("name", $(field).attr("name").replace(/\d+$/, (i + 1)));
                    }
                );

                $(row).css("background-color", "#" + (((i % 2) == 1) ? "F1F1F1" : "FFFFFF"));
            }
        );
    }
}

export default EvidenceProfile;
