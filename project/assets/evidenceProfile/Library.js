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
    				"value": confidence_judgements[i].value
    				,"name": confidence_judgements[i].name
    			};

    			returnValue.values[i] = confidence_judgements[i].value;
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
        if ((typeof(fieldName) === "string") && (fieldName !== "") && (typeof(position) === "string") && (position !== "")) {
            // Both incoming arguments are non-empty strings, continue

            // First, look for an element whose ID matches fieldName exactly
            let fieldList = document.querySelectorAll("#" + fieldName);
            if (fieldList.length === 0) {
                // No matching element was found, append "div_id_" in front of fieldName and look for that element
                fieldList = document.querySelectorAll("#div_id_" + fieldName);
            }

            if (fieldList.length > 0) {
                // The desired element was found, add the <hr /> tag where desired
                fieldList[0].insertAdjacentHTML(
                    (position.toLowerCase() !== "before") ? "afterend" : "beforebegin",
                    '<hr style="margin-top:32px; border-width:1px;" />'
                );
            }
        }
    }
}

export default Library;