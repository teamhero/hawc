import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import EvidenceProfileStream from "../../EvidenceProfileStream";

import "./index.css";

// This Component object is the container for the entire Evidence Profile Stream formset
class EvidenceProfileStreamsFormset extends Component {
    streams = [];

    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        // Get the incomingstreams from the props and save them as an object-level attribute (defaulting to an empty
        // array if no streams were passed in); then push an empty stream onto the end of the array
        this.streams = (("streams" in props) && (typeof(props.streams) === "object")) ? props.streams : [];
        this.streams.push(new EvidenceProfileStream());

        // Set the initial row objects based on the incoming profile streams
        this.state = {
            divs: this.buildStreamDivs(),
        };
    }

    // This method takes the object-level streams attribute and uses it to build an array of formset rows -- one for each stream
    buildStreamDivs() {
        let returnValue = [];

        let countStreams = this.streams.length;
        for (let i=0; i<countStreams; i++) {
            returnValue.push(
                <StreamDiv
                    key={i}
                    order={i + 1}
                    maxOrder={countStreams}
                    idPrefix={this.props.config.streamDivIdPrefix}
                    fieldIdPrefix={this.props.config.fieldIdPrefix}
                    types={this.props.config.streamTypes}
                    stream={this.streams[i].object}
                />
            );
        }

        return returnValue;
    }

    // This method generates the HTML that replaces this object's JSX representation
    render() {
        return (
            <div className="streamsDiv">
                <strong className="control-label">Profile Streams</strong>
                <button id={this.props.config.addButtonId} className="btn btn-primary pull-right" type="button" onClick={this.handleButtonClick}>New Inference</button>
                <br className="streamsClearBoth" />
                {this.state.divs}
            </div>
        );
    }
}

// This object is a single Evidence Profile Stream form fragment
class StreamDiv extends Component {
    streamRows = [
        {
            className: "streamPartDiv streamPartDivGrey",
            divs: [
                {
                    width: "48%",
                    float: "left",
                    margin: "0 4px 0 0"
                },
                {
                    width: "48%",
                    float: "left",
                    margin: "0 4px 0 0"
                },
            ],
        }
    ];

    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        // Use the incoming props.stream object to population this object's state
        this.state = {
            stream_type: props.stream.stream_type,
            stream_title: props.stream.stream_title,
        };
    }

    render() {
        // These fields will get used multiple times each, so it is a good idea to go ahead and declare them
        const streamTypeFieldName = this.props.fieldIdPrefix + "_stream_type_" + this.props.order;

        console.log(streamTypeFieldName);
        console.log(this.props.types);

        return (
            <div id={this.props.idPrefix + "_" + this.props.order} className="streamDiv">
                <div className={this.streamRows[0].className}>
                    <div style={this.streamRows[0].divs[0]}>
                        <label for={streamTypeFieldName} className="control-label">Type</label>
                        <div class="controls">
                            <select id={streamTypeFieldName} name={streamTypeFieldName} required="required" value={(this.state.stream_type !== null) ? this.state.stream_type : ""} onChange={(e) => this.updateField(e, streamTypeFieldName)}>
                                <option value="">Select Stream Type</option>
                            </select>
                        </div>
                    </div>
                    <div style={this.streamRows[0].divs[1]}>
                        Man
                    </div>
                </div>
                <br className="streamsClearBoth" />
            </div>
        );
    }

/*
*/

    componentWillReceiveProps(nextProps) {
    }

    updateField(event, fieldName) {
        console.log("Dude!");
    }
}

/*
*/

// This function is used to create and then populate the <div> element in the Evidence Profile form that will hold and manage the formset for the
// individual Evidence Profile Streams
export function renderEvidenceProfileStreamsFormset(streams, formConfig, streamsConfig) {
    // First, look for the <div> element in the Evidence Profile form that holds the profile's caption -- the Streams'  formset will be just
    // beneath the caption
    let captionDivList = document.querySelectorAll("#" + formConfig.captionDiv);
    if (captionDivList.length > 0) {
        // The desired element was found in the page, attempt to add the new element as desired

        captionDivList[0].insertAdjacentHTML("afterend", '<hr style="margin-top:32px; height:1px;" /><div id="' + streamsConfig.divId + '" style="font-size:0.9em; margin:0 0 32px 0; padding:0"></div>');
        ReactDOM.render(
            <EvidenceProfileStreamsFormset streams={streams} config={streamsConfig} />,
            document.getElementById(streamsConfig.divId)
        );
    }
}

export default EvidenceProfileStreamsFormset;
