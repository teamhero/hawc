import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

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
    				"value": confidence_factors[i].id
    				,"name": confidence_factors[i].name
    			};

    			returnValue.values[i] = confidence_factors[i].name;
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

// This function attempts to update the Outcome <option>s in an Evidence Profile Stream's child Evidence Profile Scenario child objects
export function updateOutcomesOptionSet(streamIndex) {
    if ((typeof(streamIndex) === "number") && (streamIndex >= 1)) {
        // streamIndex is syntactically valid, look for the DOM element with the expected ID

        let outcomesFormsetId = "table_outcomes_" + Math.floor(streamIndex);
        let outcomesFormset = document.getElementById(outcomesFormsetId);
        let scenariosFormsetId = "div_scenarios_" + Math.floor(streamIndex);
        let scenariosFormset = document.getElementById(scenariosFormsetId);
        if ((outcomesFormset !== null) && (scenariosFormset !== null)) {
            // The expected DOM elements were found, continue

            // First, look for the outcome table body rows and iterate over them
            let optionSet = '<option value="">Select Score</option>';
            /*
            let optionSet = [
                <option key={0} value={""}>Select Score</option>
            ];
            */

            let outcomes = outcomesFormset.getElementsByClassName("outcomesBodyRow");
            let iTo = outcomes.length;
            for (let i=0; i<iTo; i++) {
                let orderFields = outcomes[i].getElementsByClassName("outcomesInputOrder");
                let titleFields = outcomes[i].getElementsByClassName("outcomesInputTitle");
                let scoreFields = outcomes[i].getElementsByClassName("outcomesSelectScore");

                if ((orderFields.length > 0) && (titleFields.length > 0) && (scoreFields.length > 0)) {
                    // This row includes the expected form fields, use their values to build the set of options

                    let orderValue = orderFields[0].value;
                    let titleValue = titleFields[0].value;
                    let scoreValue = scoreFields[0].value;

                    orderValue = (!isNaN(orderValue)) ? Math.floor(orderValue * 1) : 0;
                    if ((orderValue > 0) && (titleValue !== "") && (scoreValue !== "")) {
                        // This row's order field has a syntactically valid value

                        // Iterate over the outcome score's <option>s to find the one whoe name corresponds to scoreValue
                        let scoreName = "";
                        let scoreNames = scoreFields[0].getElementsByTagName("option");
                        let j = 0;
                        let jTo = scoreNames.length;
                        while ((scoreName === "") && (j < jTo)) {
                            if ((scoreNames[j].value !== "") && (scoreNames[j].value === scoreValue)) {
                                // This score name's corresponding value is not empty AND matches the selected value from the same <select> element, save the
                                // name to scoreName
                                scoreName = scoreNames[j].innerHTML;
                            }

                            j++;
                        }

                        if (scoreName !== "") {
                            // The score's name was found push a corresponding <option> onto optionSet
                            /*
                            optionSet.push(<option key={optionSet.length} value={titleValue + "|" + scoreValue}>{"title: " + titleValue + ", score: " + scoreName}</option>);
                            */
                            optionSet = optionSet + '<option value="' + titleValue + "|" + scoreValue + '">title: ' + titleValue + ', score: ' + scoreName + '</option>';
                        }
                    }
                }
            }

            // optionSet has been built, update the outcome <select> in each scenario
            let scenarios = scenariosFormset.getElementsByClassName("scenarioDiv");
            iTo = scenarios.length;
            for (let i=0; i<iTo; i++) {
                let outcomeField = scenarios[i].getElementsByClassName("scenarioOutcome");
                if (outcomeField.length > 0) {
                    // This scenario <div> includes the desired <select> field, attempt to change its optionSet

                    let temp = outcomeField[0].value;
                    outcomeField[0].innerHTML = optionSet;
                    outcomeField[0].value = temp;
                }
            }
        }
    }
}

export default Library;
