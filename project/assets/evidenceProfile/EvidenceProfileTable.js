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

        // Initialize the column configuration for this table
        this.columns = [
            {
                label: "Outcomes",
                width: 0.125,
            },
            {
                label: "Studies",
                width: 0.125,
            },
            {
                label: "Factors that Increase Confidence",
                width: 0.125,
            },
            {
                label: "Factors that Decrease Confidence",
                width: 0.125,
            },
            {
                label: "Summary of Findings and Confidence Judgement for Individual Outcomes",
                width: 0.125,
            },
            {
                label: "Within-Stream Confidence Judgement",
                width: 0.125,
            },
            {
                label: "Inference Across Streams",
                width: 0.125,
            },
            {
                label: "Across-Stream Confidence Judgement",
                width: 0.125,
            },
        ];

        // Iterate over this.columns and set each one's starting x coordinate and width
        var x = 0;
        var iTo = this.columns.length;
        for (var i=0; i<iTo; i++) {
            this.columns[i].x = x;
            this.columns[i].width = this.w * this.columns[i].width

            x = x + this.columns[i].width;
        }
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
            this.build_plot_skeleton(false);
            this.set_font_style(("plot_settings" in this.settings) && ("font_style" in this.settings.plot_settings) ? this.settings.plot_settings.font_style : "");
            d3.select(this.svg).attr("font-size", "12px");

            this.draw_header();

            /*
            this.draw_frame();
            this.draw_table();
            */

            /*
            this.add_final_rectangle();
            */

            this.add_menu({exclude:"download"});
            this.trigger_resize();
        }
        else {
            // This object is completely empty
            return HAWCUtils.addAlert('<strong>Error: </strong>no profile data are available to be summarized', this.plot_div);
        }
    }

    // This method draws the header for this table
    draw_header() {
        if (this.table_header) {
            // This object already has a table_header, remove it
            this.table_header.remove();
        }

        // Create the object that will hold the header for this table
        this.table_header = d3.select(this.svg).append("g").attr("class", "table_header");

        // Get the padding for the overall table
        var tablePadding = (("plot_settings" in this.settings) && ("padding" in this.settings.plot_settings)) ? this.settings.plot_settings.padding : this.defaultSettings.plot_settings.padding;

        // Set some values for the height and padding of lines within columns' headers, as well as some overall header padding
        var rowHeight = 12;

        var headerPadding = {
            top: 2,
            bottom: 4,
        };

        var columnPadding = {
            top: 4,
            right: 4,
            bottom: 4,
            left: 4,
        };

        // Create a text node that will be used to construct the header columns' details
        var textNode = this.table_header.append("text");

        // Iterate over this.columns to build each column's headere details
        var iTo = this.columns.length;
        for (var i=0; i<iTo; i++) {
            // Add a text node to the D3 table_header node, and store a reference to it in the current column, along with an empty array of header lines and
            // the total width available to this column's header
            this.columns[i].header = {
                lines: [],
                availableWidth: this.columns[i].width - columnPadding.left - columnPadding.right,
            };

            // Create a text span node that will be used to construct the header details for this column
            var textSpan = textNode.append("tspan");

            // Iterate over the words in the column's label to build the header
            var words = this.columns[i].label.split(" ");
            var jTo = words.length;
            var line = [];
            for (var j=0; j<jTo; j++) {
                line.push(words[j]);
                textSpan.text(line.join(" "));

                if (textSpan.node().getComputedTextLength() > (this.columns[i].header.availableWidth + 2)) {
                    // This line has gotten too long for the column, handle it

                    if (line.length > 1) {
                        // This line contains more than one word

                        // Remove the last word from line -- it is the one that went too far
                        line.pop();

                        // Convert line to a string and add it to this column's set of text fields and modify the text in textSpan
                        this.columns[i].header.lines.push(line.join(" "));

                        // Re-set line to only include the latest word (the one that made this too long)
                        line = [
                            words[j]
                        ];
                    }
                    else {
                        // This line contains only one word

                        // Add this word to this column's set of text fields
                        this.columns[i].header.lines.push(line[0]);

                        // Clear out line
                        line = [];
                    }
                }
            }

            if (line.length > 0) {
                // At least one word has not yet been added to the header, add it now
                this.columns[i].header.lines.push(line.join(" "));
            }

            // Remove the text span node that was used
            textSpan.remove();
        }

        // Remove the text node that was used
        textNode.remove();

        // Get the length of the longest set of columns' header lines
        var headerRowCount = Math.max(...this.columns.map(column => column.header.lines.length));

        // Add a shaded rectangle for the header
        this.table_header.append("rect")
        .attr("x", tablePadding.left)
        .attr("y", tablePadding.top)
        .attr("width", this.w)
        .attr("height", headerPadding.top + headerPadding.bottom + (headerRowCount * (rowHeight + columnPadding.top + columnPadding.bottom)))
        .attr("fill", "#EEEEEE");

        // Iterate over each this.columns and place the header text in the table
        for (var i=0; i<iTo; i++) {
            // Get the first (so far only) text span node for this column's header, and calculate an "offset" between the total header lines and the
            // number of lines in this column's header
            this.columns[i].header.textNode = this.table_header.append("text");
            var offset = headerRowCount - this.columns[i].header.lines.length;

            // Iterate over the number of rows in the header to place each of this column's header lines in the proper position
            for (var j=0; j<headerRowCount; j++) {
                // Add a text span node to this column's header
                var textSpan = this.columns[i].header.textNode.append("tspan");

                // Set the text span node's text, using the offset calculated earlier to select the proper array element (defaulting to an empty
                // string if no valid element exists)
                textSpan.text(((j - offset) >= 0) ? this.columns[i].header.lines[j - offset] : "");

                var em = 1;
                while ((textSpan.node().getComputedTextLength() > (this.columns[i].header.availableWidth + 2)) && (em > 0.5)) {
                    // This text is (still) considered too wide for this field, attempt to reduce the font size until it fits
                    em = em * 0.95;
                    textSpan.attr("font-size", em + "em");
                }

                // Save the font size value (in em) for this column's header
                this.columns[i].header.em = ("em" in this.columns[i].header) ? Math.min(em, this.columns[i].header.em) : em;

                // Place the text span on the page
                textSpan
                .attr("x", this.columns[i].x + tablePadding.left + columnPadding.left + ((this.columns[i].header.availableWidth - textSpan.node().getComputedTextLength()) / 2))
                .attr("y", (j * (rowHeight + columnPadding.top + columnPadding.bottom)) + (rowHeight + headerPadding.top + tablePadding.top + columnPadding.top));
            }

            if (this.columns[i].header.em < 1) {
                // At least one line of this column's header text needed its font size adjusted, adjust the font for all lines

                // Get values from the this scope that will be used when iterating over this column's text span nodes
                var em = this.columns[i].header.em;
                var x = this.columns[i].x;
                var availableWidth = this.columns[i].header.availableWidth;

                // Iterate over each of this column's text span nodes and set each one's font size and starting x-coordinate
                this.columns[i].header.textNode.selectAll("tspan").each(
                    function() {
                        var node = d3.select(this);

                        node
                        .attr("font-size", em + "em")
                        .attr("x", x + tablePadding.left + columnPadding.left + ((availableWidth - node.node().getComputedTextLength()) / 2));
                    }
                );
            }
        }
        /*
        */
    }

    // This method draws the actual table based on the data within this.object; the skeleton for the D3 object has been built and is ready for the table
    draw_table() {
        /*
        console.log("In EvidenceProfileTable.draw_table()");
        console.log(this.object);
        */
    }
}

export default EvidenceProfileTable;
