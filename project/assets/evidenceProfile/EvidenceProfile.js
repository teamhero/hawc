import $ from '$';
import d3 from 'd3';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

import Library from './Library';
import EvidenceProfileStream from './EvidenceProfileStream';

import { renderCrossStreamInferencesFormset } from './components/CrossStreamInferences';

// This class is intended to hold an Evidence Profile object -- essentially all of the data needed to generate an Evidence Profile report,
// or a form for creating and managing an Evidence Profile
class EvidenceProfile {
    constructor(configuration) {
        // This constructor is empty, all work happens through static methods
    }

    static configure(configuration, object) {
        if ((typeof(configuration) === "object") && (typeof(object) === "object")) {
            // The configuration argument is an object, save it for later use
            EvidenceProfile.configuration = configuration;
            EvidenceProfile.object = object;
        }
    }

    // This function builds the formset for the "Cross-Stream Inferences" portion of the Evidence Profile form
    static buildCrossStreamInferencesFormset() {
        renderCrossStreamInferencesFormset(EvidenceProfile.object.cross_stream_conclusions.inferences, EvidenceProfile.configuration.form, EvidenceProfile.configuration.crossStreamInferences);
    }

    // This method attempts to check the incoming evidenceProfile object to make sure that it is an object and has a "cross_stream_conclusions" attribute
    // that matches the desired format
    static checkEvidenceProfile(evidenceProfile) {
        var returnValue = {};

        if (typeof(evidenceProfile) == "object") {
            // The incoming evidenceProfile argument is an ojbect, use it for the basis of returnValue
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
        }

        return returnValue;
    }
}

export default EvidenceProfile;
