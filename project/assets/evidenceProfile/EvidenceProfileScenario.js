import $ from '$';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

// This class defines a single Evidence Profile Scenario; an Evidence Profile Stream object contains one or more Evidence Profile Scenario objects of this class
class EvidenceProfileScenario {
    // This defines the object attributes' names (key) and data types (value)
    objectAttributes = {
        pk: "number",
        outcome: "object",
        summary_of_findings: "object",
        scenario_name: "string",
        studies: "object",
        confidencefactors_increase: "array",
        confidencefactors_decrease: "array",
        summary_of_findings: "object",
    };

    // This constructor takes in an object and attempts to copy the desired attributes to this object's object-level "object" attribute
    constructor(object) {
        this.object = {};

        if (typeof(object) === "object") {
            // The incoming object argument is indeed an object, look for the expected object fields and use them to populate this.object

            // Iterate through the desired set of object attributes and look for each one in the incoming argument
            for (let attributeName in this.objectAttributes) {
                // If the object argument contains the desired attribute and it is of the desired datatype, copy it to this object's "object"
                // attribute; otherwise, set the attribute to null
                this.object[attributeName] = (
                    (attributeName in object)
                    && (
                        (typeof(object[attributeName]) === this.objectAttributes[attributeName])
                        || (
                            (this.objectAttributes[attributeName] === "array")
                            && (Array.isArray(object[attributeName]))
                        )
                    )
                ) ? object[attributeName] : null;
            }
         }
         else {
            // The incoming object argument is not an object, initialize this EvidenceProfileStream object to an empty stream

            // Iterate through the desired set of object attributes and set each one to null in the object-level attribute
            for (let attributeName in this.objectAttributes) {
                this.object[attributeName] = null;
            }
        }
    }
}

export default EvidenceProfileScenario;
