import $ from '$';
import d3 from 'd3';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

class Library {
    constructor() {
        // There is nothing in this constructor, it is just a placeholder for a set of static functions
    }

    // This method takes in an array of valid stream types and returns an object that includes that array and an array of
    // valid primary key values
    static setStreamTypes(stream_types) {
    	var returnValue = {
    		"types": stream_types
    		,"values": []
    	}

    	// Iterate through the incoming array and add each element's 'value' attribute to the list of values
	    for (var i=0; i<stream_types.length; i++) {
    		returnValue.values[returnValue.values.length] = stream_types[i].value;
	    }

	    return returnValue;
    }

    // This method takes in an array of valid confidence judgements and returns an object that includes a simplified version
    // of that array and an array of valid primary key values
    static setConfidenceJudgements(confidence_judgements) {
    	var returnValue = {
    		"judgements": []
    		,"values": []
    	};

    	if (typeof(confidence_judgements) == "object") {
    		// The incoming confidence_judgements argument is of the expected type, iterate through its elements to build returnValue
    		for (var i=0; i<confidence_judgements.length; i++) {
    			returnValue.judgements[i] = {
    				"value": confidence_judgements[i].fields.value
    				,"name": confidence_judgements[i].fields.name
    			};

    			returnValue.values[i] = confidence_judgements[i].fields.value;
    		}
    	}

    	return returnValue;
    }

    // This method takes in an array of valid confidence factors and returns an object that includes a simplified version
    // of that array and an array of valid primary key values
    static setConfidenceFactors(confidence_factors) {
    	var returnValue = {
    		"factors": []
    		,"values": []
    	};

    	if (typeof(confidence_factors) == "object") {
    		// The incoming confidence_factors argument is of the expected type, iterate through its elements to build returnValue
    		for (var i=0; i<confidence_factors.length; i++) {
    			returnValue.factors[i] = {
    				"value": confidence_factors[i].pk
    				,"name": confidence_factors[i].fields.name
    			};

    			returnValue.values[i] = confidence_factors[i].fields.name;
    		}
    	}

    	return returnValue;
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

    // This function sets the click() functionality for the "Move Up", "Move Down" and "Remove" set of buttons
    static setButtonSetClickActions(buttonSetBaseId="", rowIdPrefix="", tableId="", index=0) {
        if (
            (typeof(buttonSetBaseId) == "string") && (buttonSetBaseId != "")
            && (typeof(rowIdPrefix) == "string") && (rowIdPrefix != "")
            && (typeof(tableId) == "string") && (tableId != "")
            && (typeof(index) == "number")
        ) {
            // The buttonSet, rowIdPrefix and tableId arguments are non-emtpy strings and the index argument is numeric, continue

            index = Math.floor(index);
            if (index > 0) {
                // The index argument is (now) an integer and is greater than zero, continue

                var $button = $();

                // Try to add the click() functionality for the target "Move Up" button
                $button = $("#" + buttonSetBaseId + "_moveup_" + index);
                if ($button.length > 0) {
                    // The desired "Move Up" button was found, set its click() functionality

                    $button.click(
                        function(e) {
                            var id = $(this).attr("id");
                            if ((typeof(id) != "undefined") && (id != "") && (id.match(new RegExp("^" + buttonSetBaseId + "_moveup_\\d+$", "g")))) {
                                // The clicked-on element has an id attribute whose value matches the desired naming convention, work with it

                                var $row = $("#" + rowIdPrefix + "_" + id.replace(new RegExp("^" + buttonSetBaseId + "_moveup_(\\d+)$", "g"), "$1"));
                                if ($row.length > 0) {
                                    // The desired table row element was retrieved, see if it has an immediate previous sibling

                                    var $previous = $row.prev();
                                    if ($previous.length > 0) {
                                        // A previous sibling was found, swap the positions of the two and adjust the values of the ordering variables
                                        $row.after($previous);
                                        Library.updateTableRows(tableId);
                                    }
                                }
                            }
                        }
                    );
                }

                // Try to add the click() functionality for the target "Move Down" button
                $button = $("#" + buttonSetBaseId + "_movedown_" + index);
                if ($button.length > 0) {
                    // The button was found, set its click() functionality

                    $button.click(
                        function(e) {
                            var id = $(this).attr("id");
                            if ((typeof(id) != "undefined") && (id != "") && (id.match(new RegExp("^" + buttonSetBaseId + "_movedown_\\d+$", "g")))) {
                                // The clicked-on element has an id attribute whose value matches the desired naming convention, work with it

                                var $row = $("#" + rowIdPrefix + "_" + id.replace(new RegExp("^" + buttonSetBaseId + "_movedown_(\\d+)$", "g"), "$1"));
                                if ($row.length > 0) {
                                    // The desired table row element was retrieved, see if it has an immediate next sibling

                                    var $next = $row.next();
                                    if ($next.length > 0) {
                                        // A next sibling was found, swap the positions of the two and adjust the table shading
                                        $next.after($row);
                                        Library.updateTableRows(tableId);
                                    }
                                }
                            }
                        }
                    );
                }

                // Try to add the click() functionality for the target "Move Remove" button
                $button = $("#" + buttonSetBaseId + "_remove_" + index);
                if ($button.length > 0) {
                    // The button was found, set its click() functionality

                    $button.click(
                        function(e) {
                            var id = $(this).attr("id");
                            if ((typeof(id) != "undefined") && (id != "") && (id.match(new RegExp("^" + buttonSetBaseId + "_remove_\\d+$", "g")))) {
                                // The clicked-on element has an id attribute whose value matches the desired naming convention, work with it

                                var $row = $("#" + rowIdPrefix + "_" + id.replace(new RegExp("^" + buttonSetBaseId + "_remove_(\\d+)$", "g"), "$1"));
                                if ($row.length > 0) {
                                    // The desired table row element was retrieved, remove it and adjust the table shading
                                    $row.remove();
                                    Library.updateTableRows(tableId);
                                }
                            }
                        }
                    );
                }
            }
        }
    }

    // This function sets the shading and row order variables for the table specified in the incoming argument
    static updateTableRows(tableId="") {
        // Iterate through each row within the table's body and set each stream's order

        $("#" + tableId + " tbody").find("tr").each(
            function(i, row) {
                var $row = $(row);

                // Find the form field in the row that contains the stream's desired order (it has a class named "orderingField")
                $row.find(".orderingField").each(
                    function(j, field) {
                        $(field).val(i + 1);
                    }
                );

                // Set the row's color to either white (odd-numbered) or gray (even-numbered)
                $row.css("background-color", "#" + (((i % 2) == 1) ? "F1F1F1" : "FFFFFF"));
            }
        );
    }
}

export default Library;
