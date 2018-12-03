import $ from '$';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

import Library from "./Library";
import EvidenceProfileStream from "./EvidenceProfileStream";

import {renderEvidenceProfileStreamsFormset, limitStreamsToOneScenario} from "./components/EvidenceProfileStreams";
import {renderCrossStreamInferencesFormset} from "./components/CrossStreamInferences";

// This class is intended to hold an Evidence Profile object -- essentially all of the data needed to generate an Evidence Profile report,
// or a form for creating and managing an Evidence Profile
class EvidenceProfile {
    constructor(configuration) {
        // This constructor is empty, all work happens through static methods
        // The object represented by this class is intended to be a singleton -- i.e. there will only be one in use on a page at any time
    }

    static configure(configuration, object) {
        // Set the default set of D3 image settings for this table
        this.defaultSettings = {
            "plot_settings": {
                "plot_width": 400,
                "padding": {
                    "top": 25,
                    "right": 25,
                    "bottom": 40,
                    "left": 20,
                },
                "font_style": "Arial",
            },
        };

        // Initialize the top-level objects for this EvidenceProfile
        EvidenceProfile.configuration = {};
        EvidenceProfile.object = {};

        // This defines the object attributes' names (key), and data types and defaults (value)
        let objectAttributes = {
            id: {
                type: "number",
                default: 0,
            },
            title: {
                type: "string",
                default: "",
            },
            slug: {
                type: "string",
                default: "",
            },
            caption: {
                type: "string",
                default: "",
            },
            cross_stream_confidence_judgement: {
                type: "object",
                default: {},
            },
            cross_stream_inferences: {
                type: "array",
                default: [],
            },
            streams: {
                type: "array",
                default: [],
            },
            one_scenario_per_stream: {
                type: "boolean",
                default: false,
            },
        };

        if (typeof(configuration) === "object") {
            // The configuration argument is an object, save it for later use
            EvidenceProfile.configuration = configuration;

            if (typeof(object) === "object") {
                // The object argument is an object, iterate through it to build this object's object attribute

                for (let attributeName in objectAttributes) {
                    if (
                        (attributeName in object)
                        && (
                            (typeof(object[attributeName]) === objectAttributes[attributeName].type)
                            || (
                                (objectAttributes[attributeName].type === "array")
                                && (Array.isArray(object[attributeName]))
                            )
                        )
                    ) {
                        // The object argument has the desired attribute name, and the attribute is of the desired type, copy it to this
                        // object's object attribute
                        EvidenceProfile.object[attributeName] = object[attributeName];
                    }
                    else {
                        // The object argument does not have the desired attribute name, or it is not of the desired type, set a default value
                        // in this object's object attribute
                        EvidenceProfile.object[attributeName] = objectAttributes[attributeName].default;
                    }
                }
            }
        }
        else {
            // The configuration argument is not an object, set this object's configuration and object attributes to null
            EvidenceProfile.configuration = null;
            EvidenceProfile.object = null;
        }

        if ((EvidenceProfile.object !== null) && ("streams" in EvidenceProfile.object) && (EvidenceProfile.object.streams.length > 0)) {
            // One or more streams were provided as part of the object argument, convert each simple stream object into a formal
            // EvidenceProfileStream object
            let originalStreams = EvidenceProfile.object.streams;
            EvidenceProfile.object.streams = [];

            // Iterate through each of the original simple objects and use them as the incoming arguments for the EvidenceProfileStream
            // object's contructor
            let iTo = originalStreams.length;
            for (let i=0; i<iTo; i++) {
                EvidenceProfile.object.streams.push(new EvidenceProfileStream(originalStreams[i]));
            }
        }
    }

    // This function builds the formset for the "Evidence Profile Streams" portion of the Evidence Profile form
    static buildEvidenceProfileStreamsFormset() {
        renderEvidenceProfileStreamsFormset(EvidenceProfile.object.id, EvidenceProfile.object.streams, EvidenceProfile.configuration.form, EvidenceProfile.configuration.streams, EvidenceProfile.object.one_scenario_per_stream);
    }

    // This function builds the formset for the "Cross-Stream Inferences" portion of the Evidence Profile form
    static buildCrossStreamInferencesFormset() {
        renderCrossStreamInferencesFormset(EvidenceProfile.object.id, EvidenceProfile.object.cross_stream_inferences, EvidenceProfile.configuration.form, EvidenceProfile.configuration.crossStreamInferences);
    }

    // This function goes through all of the child streams and makes sure they are limited to one single scenario each
    static onlyOneScenarioPerStream(element) {
        limitStreamsToOneScenario(element);
    }
}

// Export an EvidencProfile object as the default object
export default EvidenceProfile;
