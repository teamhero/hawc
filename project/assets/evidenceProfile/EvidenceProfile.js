import $ from '$';
import d3 from 'd3';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

import EvidenceProfileStream from './EvidenceProfileStream';

// This class is intended to hold an Evidence Profile object -- essentially all of the data needed to generate an Evidence Profile report,
// or a form for creating and managing an Evidence Profile
class EvidenceProfile {
    constructor(configuration) {
    	// This constructor is empty, all work happens through static methods
    }

    static configure(configuration) {
    	console.log("In EvidenceProfile.configure()");
    	if (typeof(configuration) == "object") {
    		// The configuration argument is an object, save it for later use
    		this.configuration = configuration;
    	}
    }

    static getConfiguration() {
    	console.log("In EvidenceProfile.getConfiguration()");
    	return(this.configuration);
    }
}

export default EvidenceProfile;
