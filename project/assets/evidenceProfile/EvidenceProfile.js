import $ from '$';
import d3 from 'd3';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

import Library from "./Library";
import EvidenceProfileStream from "./EvidenceProfileStream";

import {renderCrossStreamInferencesFormset} from "./components/CrossStreamInferences";
import {renderEvidenceProfileStreamsFormset} from "./components/EvidenceProfileStreams";

// This class is intended to hold an Evidence Profile object -- essentially all of the data needed to generate an Evidence Profile report,
// or a form for creating and managing an Evidence Profile
class EvidenceProfile {
    constructor(configuration) {
        // This constructor is empty, all work happens through static methods
        // The object represented by this class is intended to be a singleton -- i.e. there will only be one in use on a page at any time
    }

    static configure(configuration, object) {
        // This defines the object attributes' names (key) and data types (value)
        let objectAttributes = {
            title: "string",
            slug: "string",
            settings: "string",
            caption: "string",
            cross_stream_conclusions: "object",
            streams: "array"
        };

        EvidenceProfile.object = {};

        if (typeof(configuration) === "object") {
            // The configuration argument is an object, save it for later use
            EvidenceProfile.configuration = configuration;

            if (typeof(object) === "object") {
                // The object argument is an object, iterate through it to build this object's object attribute

                for (let attributeName in objectAttributes) {
                    if ((attributeName in object) && (typeof(object[attributeName]) === objectAttributes[attributeName])) {
                        // The object argument has the desired attribute name, and the attribute is of the desired type, copy it to this
                        // object's object attribute
                        EvidenceProfile.object[attributeName] = object[attributeName];
                    }
                    else {
                        // The object argument does not have the desired attribute name, or it is not of the desired type, set an empty counterpart
                        // in this object's object attribute

                        switch (objectAttributes[attributeName]) {
                            case "string":
                                // The attribute should be a string
                                EvidenceProfile.object[attributeName] = "";
                                break;
                            case "object":
                                // The attribute should be an object
                                EvidenceProfile.object[attributeName] = {};
                                break;
                            case "array":
                                // The attribute should be an array
                                EvidenceProfile.object[attributeName] = [];
                                break;
                            default:
                                // The desired type was not handled (e.g. a number), set the object's attribute to null
                                EvidenceProfile.object[attributeName] = null;
                        }
                    }
                }
            }
        }
        else {
            // The configuration argument is not an object, set this object's configuration and object attributes to null
            EvidenceProfile.configuration = null;
            EvidenceProfile.object = null;
        }
    }

    // This function builds the formset for the "Evidence Profile Streams" portion of the Evidence Profile form
    static buildEvidenceProfileStreamsFormset() {
        renderEvidenceProfileStreamsFormset(EvidenceProfile.object.streams, EvidenceProfile.configuration.form, EvidenceProfile.configuration.streams);
    }

    // This function builds the formset for the "Cross-Stream Inferences" portion of the Evidence Profile form
    static buildCrossStreamInferencesFormset() {
        renderCrossStreamInferencesFormset(EvidenceProfile.object.cross_stream_conclusions.inferences, EvidenceProfile.configuration.form, EvidenceProfile.configuration.crossStreamInferences);
    }

    // This method attempts to check the incoming evidenceProfile object to make sure that it is an object and has a "cross_stream_conclusions" attribute
    // that matches the desired format
    static checkEvidenceProfile(evidenceProfile) {
        var returnValue = {};

        if (typeof(evidenceProfile) === "object") {
            // The incoming evidenceProfile argument is an object, use it for the basis of returnValue

            console.log(EvidenceProfile.objectAttributes);
            console.log(EvidenceProfile);

            for (let attributeName in EvidenceProfile.objectAttributes) {
                console.log(attributeName);
            }

            /*
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
            */
        }

        return returnValue;
    }


    // This method attempts to check the incoming streams array of objects to make sure that they match the desired format
    static checkStreams(streams) {
        var returnValue = [];

        if (typeof(streams) === "object") {
            // streams is an object, assume it is an array and iterate over its elements to check each one
            for (let i=0; i<streams.length; i++) {
                if (typeof(streams[i]) == "object") {
                    // This stream is an object, attempt to instantiate it and push it onto the array being returned
                    returnValue.push(new EvidenceProfileStream(streams[i]));
                }
            }
        }

        return returnValue;
    }
}

export default EvidenceProfile;
