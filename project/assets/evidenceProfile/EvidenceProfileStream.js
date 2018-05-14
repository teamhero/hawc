import $ from '$';
import d3 from 'd3';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

// This class defines a single Evidence Profile Stream; an Evidence Profile object contains one or more Evidence Profile Stream objects of this class
class EvidenceProfileStream {
    // This defines the object attributes' names (key) and data types (value)
    objectAttributes = {
        stream_type: "number",
        stream_title: "string",
        confidence_judgement: "object",
        outcomes: "object",
    };

    // This constructor takes in an object and attempts to copy the desired attributes to this object's object-level "object" attribute
    constructor(object) {
        this.object = {};

        if (typeof(object) == "object") {
            // The incoming object argument is indeed an object, look for the expected object fields and use them to populate this.object

            // Iterate through the desired set of object attributes and look for each one in the incoming argument
            for (let attributeName in this.objectAttributes) {
                // If the object argument contains the desired attribute and it is of the desired datatype, copy it to this object's "object"
                // attribute; otherwise, set the attribute to null
                this.object[attributeName] = ((attributeName in object) && (typeof(object[attributeName]) === this.objectAttributes[attributeName])) ? this.object[attributeName] = object[attributeName] : null;
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

export default EvidenceProfileStream;
