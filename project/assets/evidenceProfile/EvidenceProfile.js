import $ from '$';
import d3 from 'd3';

import {saveAs} from 'filesaver.js';

import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

class EvidenceProfile {
    constructor() {
    }

    // This function builds the form fields for the cross-stream inferences portion of the Evidence Profile form
    static buildCrossStreamInferencesFormFields(cross_stream_conclusions) {
        var $lastField = $("#div_id_confidence_judgement_explanation");
        if ($lastField.length > 0) {
            // This page has the desired form field object, add the desired form fields to it

            // First, create the new <div> element that will hold the cross-stream inferences
            var newDiv = '<div id="div_id_inferences" class="control-label" style="font-size:0.9em; overflow-x:scroll;">';
            newDiv = newDiv + ' <strong class="control-label">Inferences Across Streams</strong>';
            newDiv = newDiv + ' <button id="add_inference_row" class="btn btn-primary pull-right" type="button">New Row</button>'
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

            // Now add the newly-build <div> element to the end of the form
            $lastField.after(newDiv);


            if ((typeof(cross_stream_conclusions) == "object") && (typeof(cross_stream_conclusions.inferences) == "object") && (cross_stream_conclusions.inferences.length > 0)) {
                // The existing EvidenceProfile object has a set of cross-stream inferences, iterate over the array and add each one to the table
                for (var i=0; i<cross_stream_conclusions.inferences.length; i++) {
                    EvidenceProfile.createCrossStreamInferencesRow("table_id_inferences", cross_stream_conclusions.inferences[i].title, cross_stream_conclusions.inferences[i].explanation);
                }
            }

            // Now set the click() functionality for the button to add an inference
            $("#add_inference_row").click(
                function() {
                    EvidenceProfile.createCrossStreamInferencesRow("table_id_inferences");
                }
            );
        }
    }

    // This function creates a table row for a new Cross-Stream Inference within the Cross-Stream Inferences table in the form
    // This can be used to create either a new, empty inference or add one that already exists within the Evidence Profile
    static createCrossStreamInferencesRow(table_id, title="", explanation="") {
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
                EvidenceProfile.setCrossStreamButtonClicks(index);
                EvidenceProfile.updateCrossStreamInferencesTable();
            }
        }
    }

    // this function sets the click() functionality for the "Move Up", "Move Down" and "Remove" buttons for a cross-stream inference
    static setCrossStreamButtonClicks(index) {
        if (typeof(index) == "number") {
            // The index argument is numeric, continue

            index = Math.floor(index);
            if (index > 0) {
                // The index argument is (now) an integer and is greater than zero, continue

                // Try to add the click() functionality for the target "Move Up" button
                var $button = $("#btn_inferences_moveup_" + index);
                if ($button.length > 0) {
                    // The button was found, set its click() functionality

                    // Add the click() functionality for the "Move Up" button created for this row
                    $("#btn_inferences_moveup_" + index).click(
                        function(e) {
                            var id = $(this).attr("id");
                            if ((typeof(id) != "undefined") && (id != "") && (id.match(/^btn_inferences_moveup_\d+$/))) {
                                // The clicked-on element has an id attribute whose value matches the desired naming convention, work with it

                                var $row = $("#row_id_inferences_" + id.replace(/btn_inferences_moveup_(\d)+$/, "$1"));
                                if ($row.length > 0) {
                                    // The desired table row element was retrieved, see if it has an immediate previous sibling

                                    var $previous = $row.prev();
                                    if ($previous.length > 0) {
                                        // A previous sibling was found, swap the positions of the two and adjust the table shading
                                        $row.after($previous);
                                        EvidenceProfile.updateCrossStreamInferencesTable();
                                    }
                                }
                            }
                        }
                    );
                }

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
