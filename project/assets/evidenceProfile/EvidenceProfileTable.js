import $ from '$';
import _ from 'underscore';
import d3 from 'd3';

import D3Plot from 'utils/D3Plot';
import HAWCUtils from 'utils/HAWCUtils';

// This object manages an D3 object representing an Evidence Profile
class EvidenceProfileTable extends D3Plot {
    // This constructor takes in three arguments:
    //      * object -- the Evidence Profile object from which the table is being constructed
    //      * tableDiv -- the DOM element (presumably a <div> tag) that will hold the table
    //      * defaultSettings -- a default set of  settings for the D3 object
	constructor(object, plot_div, defaultSettings) {
		// First, initialize the superclass object
        super();

        // Set the initial object variable values
        this.editable = false;
        this.object = object;

        this.settings = object.settings;
        this.settings = {
            plot_settings: {
                plot_width: 1024,
                padding: {
                    top: 10,
                    right: 12,
                    bottom: 14,
                    left: 16,
                },
                "font_style": "Times New Roman",
            }
        };
        /*
        */

        this.plot_div = $(plot_div);
        this.defaultSettings = defaultSettings;
        this.set_defaults();

        // Build the table D3 object
        this.build_plot();

		return this;
	}

    // This method sets a lot of the defaults for the D3 object
    // Whenever an expected setting is not included, the method will attempt to use the default settings instead
    set_defaults() {
        // Retrieve the desired padding
        this.padding = $.extend({}, (("plot_settings" in this.settings) && ("padding" in this.settings.plot_settings)) ? this.settings.plot_settings.padding : this.defaultSettings.plot_settings.padding);
        this.padding.left_original = this.padding.left;

        // Retrieve the desired width and set it to be a square (height will change depending on data)
        this.w = (("plot_settings" in this.settings) && ("plot_width" in this.settings.plot_settings)) ? this.settings.plot_settings.plot_width : this.defaultSettings.plot_settings.plot_width;
        this.h = this.w;

        // Set some text-related fields
        this.textPadding = 5;
        this.text_spacing_offset = 10;
    }

    // This method builds the D3 table within the desired DOM element
    // This method will assume that:
    //      * this.tableDiv is a valid D3-friendly DOM element (presumably a <div> element)
    //      * this.object is properly defined and that the expected attributes exist within it
    build_plot() {
        // Clear out the any existing HTML within the table <div>
        this.plot_div.html("");

        if (
            (this.object.title !== "")
            || (Object.keys(this.object.cross_stream_confidence_judgement).length > 0)
            || (this.object.cross_stream_inferences.length > 0)
            || (this.object.streams.length > 0)
        ) {
            // The object has at least some data (even if not completed), attempt to display the table in its current state
            this.build_plot_skeleton(true);
            this.set_font_style(("plot_settings" in this.settings) && ("font_style" in this.settings.plot_settings) ? this.settings.plot_settings.font_style : "");
            this.draw_table();
            this.add_final_rectangle();
            this.add_menu({exclude:"download"});
            this.trigger_resize();
        }
        else {
            // This object is completely empty
            return HAWCUtils.addAlert('<strong>Error: </strong>no profile data are available to be summaraized', this.plot_div);
        }
    }

    // This method draws the actual table based on the data within this.object; the skeleton for the D3 object has been built and is ready for the table
    draw_table() {
        console.log("In EvidenceProfileTable.draw_table()");
        console.log(this.object);
    }
}

export default EvidenceProfileTable;
