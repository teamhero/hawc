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

            if ((typeof(cross_stream_conclusions) == "object") && (typeof(cross_stream_conclusions.inferences) == "object") && (cross_stream_conclusions.inferences.length > 0)) {
                console.log("Inferences is not empty!");
                console.log(cross_stream_conclusions.inferences);
            }

            newDiv = newDiv + '     </tbody>';

            newDiv = newDiv + ' </table>';
            newDiv = newDiv + '</div>';

            // Now add the newly-build <div> element to the end of the form
            $lastField.after(newDiv);

            // Now set the click() functionality for the button to add an inference
            $("#add_inference_row").click(
                function() {
                    // Get the tbody of the table that was just created as part of newDiv in the previous section
                    var $tbody = $("#table_id_inferences tbody");

                    // Iterate through the rows in $tbody to come up with the index value to use when creating the next row
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
                    tr = tr + ' <td style="border:0; vertical-align:top;"><input id="inference_title_' + index + '" class="span12 textinput textInput" type="text" maxlength="50" name="inference_title_' + index + '" required="required" value="" /></td>';
                    tr = tr + ' <td style="border:0; vertical-align:top;"><textarea id="inference_explanation_' + index + '" class="span12" name="inference_explanation_' + index + '" cols="40" rows="4" required="required"></textarea></td>';
                    tr = tr + ' <td style="border:0; vertical-align:top;">';
                    tr = tr + '     <button id="btn_inferences_moveup_' + index + '" class="btn btn-mini" title="move up" type="button"><i class="icon-arrow-up" /></button><br />';
                    tr = tr + '     <button id="btn_inferences_movedown_' + index + '" class="btn btn-mini" title="move down" type="button"><i class="icon-arrow-down" /></button><br />';
                    tr = tr + '     <button id="btn_inferences_remove_' + index + '" class="btn btn-mini" title="remove" type="button"><i class="icon-remove" /></button><br />';
                    tr = tr + ' </td>';
                    tr = tr + '</tr>';

                    // Append the table row and adjust the table row shading
                    $tbody.append(tr);
                    EvidenceProfile.updateCrossStreamInferencesTable();

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

                    // Add the click() functionality for the "Move Down" button created for this row
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

                    // Add the click() functionality for the "Remove" button created for this row
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
            );
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
