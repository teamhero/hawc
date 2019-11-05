import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import EvidenceProfileStream from "../../EvidenceProfileStream";

import "./index.css";

import {renderOutcomesFormset} from "./Outcomes";
import {renderEvidenceProfileScenariosFormset} from "../EvidenceProfileScenarios";

// Set the colors to be used as shades for the alternating streams
let shade1 = "#F9F9F9";
let shade2 = "#FFFFFF";

// This Component object is the container for the entire Evidence Profile Stream formset
class EvidenceProfileStreamsFormset extends Component {
    streams = [];
    streamReferences = {};

    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        // Bind the desired class functions to this object
        this.handleButtonClick = this.handleButtonClick.bind(this);

        // First, look for a "streams" object in the incoming props -- defaulting to an empty array if none is found
        let iterateOverStreams = (("streams" in props) && (typeof(props.streams) === "object") && (props.streams !== null)) ? props.streams : [];

        // Iterate over the incoming streams and use them to build the object level "streams" and "streamReferences" attribures
        let iTo = iterateOverStreams.length;
        for (let i=0; i<=iTo; i++) {
            this.streams.push(
                {
                    stream: (i < iTo) ? iterateOverStreams[i] : (new EvidenceProfileStream()),
                    div: null,
                }
            );
        }

        // Now iterate through this.streams and build each div and reference
        for (let i=0; i<=iTo; i++) {
            this.streams[i].div = <StreamDiv
                key={i}
                ref={
                    (input) => {
                        this.streamReferences["div_" + i] = input;
                    }
                }
                index={i}
                maxIndex={iTo}
                order={(i + 1)}
                pk={this.streams[i].stream.object.pk}
                stream_type={this.streams[i].stream.object.stream_type}
                stream_type_optionSet={this.props.config.streamTypes}
                stream_title={this.streams[i].stream.object.stream_title}
                confidence_judgement={this.streams[i].stream.object.confidence_judgement}
                outcomes={this.streams[i].stream.object.outcomes}
                scenarios={this.streams[i].stream.object.scenarios}
                confidenceJudgements={this.props.confidenceJudgements}
                idPrefix={this.props.config.streamIdPrefix}
                fieldPrefix={this.props.config.fieldPrefix}
                buttonSetPrefix={this.props.config.buttonSetPrefix}
                outcomesFormsetConfig={this.props.config.outcomesFormset}
                scenariosFormsetConfig={this.props.config.scenariosFormset}
                handleButtonClick={this.handleButtonClick}
            />;
        }

        // Initialize this object state's "div" to the initial set of divs from this.streams
        this.state = {
            divs: this.streams.map(stream => stream.div),
        };
    }

    // This method generates the HTML that replaces this object's JSX representation
    render() {
        return (
            <div className={"streamsDiv"}>
                <strong className={"control-label"}>Profile Streams</strong>
                <button id={this.props.config.addButtonId} className={"btn btn-primary pull-right"} type={"button"} onClick={this.handleButtonClick}>New Stream</button>
                <br className={"streamsClearBoth"} />
                {this.state.divs}
            </div>
        );
    }

    // This function handles the clicking of a button within this formset
    handleButtonClick(event) {
        if ((typeof(event) == "object") && (typeof(event.target) == "object") && (typeof(event.target.id) == "string") && (event.target.id != "")) {
            // The click event's details were passed in, and the clicked-upon element has a non-empty ID attribute, continue checking

            if (event.target.id === this.props.config.addButtonId) {
                // The element clicked upon is the "Add A New Stream" button, add a new stream to this.streams and this.streamReferences

                // Get the next index value for this new <div>
                let newDivIndex = Math.max(...this.streams.map(stream => stream.div.props.index)) + 1;
                if (newDivIndex >= 0) {
                    let streamIndex = this.streams.length;

                    this.streams.push(
                        {
                            stream: new EvidenceProfileStream(),
                            div: null,
                        }
                    );

                    this.streams[streamIndex].div = <StreamDiv
                        key={newDivIndex}
                        ref={
                            (input) => {
                                this.streamReferences["div_" + newDivIndex] = input;
                            }
                        }
                        index={newDivIndex}
                        maxIndex={newDivIndex}
                        order={(newDivIndex + 1)}
                        stream_type={this.streams[streamIndex].stream.object.stream_type}
                        stream_type_optionSet={this.props.config.streamTypes}
                        stream_title={this.streams[streamIndex].stream.object.stream_title}
                        confidence_judgement={this.streams[streamIndex].stream.object.confidence_judgement}
                        outcomes={this.streams[streamIndex].stream.object.outcomes}
                        scenarios={this.streams[streamIndex].stream.object.scenarios}
                        confidenceJudgements={this.props.confidenceJudgements}
                        idPrefix={this.props.config.streamIdPrefix}
                        fieldPrefix={this.props.config.fieldPrefix}
                        buttonSetPrefix={this.props.config.buttonSetPrefix}
                        outcomesFormsetConfig={this.props.config.outcomesFormset}
                        scenariosFormsetConfig={this.props.config.scenariosFormset}
                        handleButtonClick={this.handleButtonClick}
                    />;

                    this.setState(
                        {
                            divs: this.streams.map(stream => stream.div),
                        }
                    ); 
                }
            }
            else if (event.target.id.match(this.props.config.buttonSetRegEx)) {
                // The element clicked upon is either a "Move Up," "Move Down" or "Remove" button from a row within the formset, attempt
                // to handle it

                let countStreams = this.streams.length;
                let buttonDetails = event.target.id.replace(this.props.config.buttonSetRegEx, "$1,$2").split(",");
                if ((buttonDetails.length == 2) && (buttonDetails[0] !== "") && (buttonDetails[1] !== "")) {
                    // Two non-empty details were extracted from the clicked-up element's ID, continue

                    buttonDetails[0] = parseInt(buttonDetails[0]);
                    if (buttonDetails[0] >= 1) {
                        // The extracted div number from the element's ID is a potentially valid value, continue

                        let streamIndex = this.findStreamIndex(buttonDetails[0]);
                        if (streamIndex > -1) {
                            // The stream was found, now see if the desired action is a valid one

                            buttonDetails[1] = buttonDetails[1].toLowerCase();
                            if ((buttonDetails[1] === "moveup") && (streamIndex > 0)) {
                                // The user clicked on the "Move Up" button and the stream is not at the top of the list, move it up in the list

                                let temp = this.streams[streamIndex];
                                this.streams[streamIndex] = this.streams[streamIndex - 1];
                                this.streams[streamIndex - 1] = temp;

                                this.setState(
                                    {
                                        divs: this.streams.map(stream => stream.div),
                                    }
                                );
                            }
                            else if ((buttonDetails[1] === "movedown") && (streamIndex < (this.streams.length - 1))) {
                                // The user clicked on the "Move Down" button and the stream is not at the bottom of the list, move it down
                                // in the list

                                let temp = this.streams[streamIndex];
                                this.streams[streamIndex] = this.streams[streamIndex + 1];
                                this.streams[streamIndex + 1] = temp;

                                this.setState(
                                    {
                                        divs: this.streams.map(stream => stream.div),
                                    }
                                );
                            }
                            else if (buttonDetails[1] === "remove") {
                                // The user clicked on the "Remove" button, remove the <div>

                                this.streams.splice(streamIndex, 1);
                                this.setState(
                                    {
                                        divs: this.streams.map(stream => stream.div),
                                    }
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    // After this Component has been updated (i.e. a <div> added, removed or moved up/down), this method runs to re-color the rows and set
    // button visibility
    componentDidUpdate() {
        let iTo = this.streams.length;
        let iMax = iTo - 1;
        for (let i=0; i<iTo; i++) {
            let reference = this.streamReferences["div_" + this.streams[i].div.props.index];

            // Alternate the <div> color on streams
            reference.divReference.style.backgroundColor = ((i % 2) === 0) ? shade1 : shade2;

            // Only make the "Move Up" button visible whenever it is not in the first stream
            reference.moveUpReference.style.visibility = (i === 0) ? "hidden" : "visible";

            // Only make the "Move Down" button visible whenever it is not in the last stream
            reference.moveDownReference.style.visibility = (i === iMax) ? "hidden" : "visible";

            // Set the value of the ordering <input />'s value for this stream's <div>
            reference.orderReference.setState(
                {
                    value: (i + 1),
                }
            );
        }
    }

    // This method attemts to find the array index of the element in this.streams that contains the EvidenceProfileStream element
    // whose index is the passed-in argument value
    // The this.treams array indices and the EvidenceProfileStream elements' index values are initially the same; but as rows get
    // moved up and down, that changes -- making this method necessary
    findStreamIndex(index) {
        let returnValue = -1;

        if (typeof(index) === "number") {
            // The index argument is a number

            index = Math.floor(index);
            if (index > 0) {
                // The integer version of index is syntactically valid (i.e. greater than zero), continue
                // The index argument is actually one greater than the row's index value because it is extracted from a button's ID attribute
                // and the buttons' attribute values are one-based instead of zero-based

                index = index - 1;
                let i = 0;
                let iTo = this.streams.length;

                // Iterate through this.inferences until we either reach the end or find the element that contains the formset row being sought
                while ((returnValue === -1) && (i < iTo)) {
                    if (this.streams[i].div.props.index === index) {
                        // The desired formset row was found, save i as returnValue
                        returnValue = i;
                    }

                    i++;
                }
            }
        }

        return returnValue;
    }
}


// This object is a single Evidence Profile Stream form fragment
class StreamDiv extends Component {
    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        this.pk = (("pk" in props) && (props.pk !== null) && (typeof(props.pk) === "number")) ? props.pk : 0;
        this.stream_type = (("stream_type" in props) && (props.stream_type !== null)) ? props.stream_type : "";
        this.stream_title = (("stream_title" in props) && (props.stream_title !== null)) ? props.stream_title : "";

        this.confidence_judgement = (("confidence_judgement" in props) && (props.confidence_judgement !== null) && (typeof(props.confidence_judgement) === "object")) ? props.confidence_judgement : {
            title: "",
            score: "",
            explanation: "",
        }

        this.outcomes = (("outcomes" in props) && (props.outcomes !== null) && (typeof(props.outcomes) === "object") && (Array.isArray(props.outcomes))) ? props.outcomes : [];
        this.scenarios = (("scenarios" in props) && (props.scenarios !== null) && (typeof(props.scenarios) === "object") && (Array.isArray(props.scenarios))) ? props.scenarios : [];

        // These fields will get used multiple times each, so it is a good idea to go ahead and declare them
        this.plusOne = this.props.index + 1;
        this.fieldPrefix = this.props.fieldPrefix + "_" + this.plusOne;
        this.buttonSetPrefix = this.props.buttonSetPrefix + "_" + this.plusOne;

        // This field contains the set of <option>s for each outcome within this stream
        // this field should get re-built any time that an outcome is modified, moved or removed
        this.outcomesOptionSet = this.buildOutcomesOptionSet();
    }

    render() {
        return (
            <div
                ref={
                    (input) => {
                        this.divReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + this.props.order}
                className={"streamDiv"}
                style={{backgroundColor:(((this.plusOne % 2) === 0) ? shade2 : shade1)}}
            >
                <InputOrder
                    ref={
                        (input) => {
                            this.orderReference = input;
                        }
                    }
                    id={this.fieldPrefix + "_order"}
                    value={this.props.order}
                />

                <input type={"hidden"} id={this.fieldPrefix + "_pk"} name={this.fieldPrefix + "_pk"} value={this.pk} />

                <div className={"streamPartDiv"}>
                    <div className={"streamPart_streamType"}>
                        <label htmlFor={this.fieldPrefix + "_stream_type"} className={"control-label"}>Type</label>
                        <div className={"controls"}>
                            <SelectStreamType
                                ref={
                                    (input) => {
                                        this.streamTypeReference = input;
                                    }
                                }
                                id={this.fieldPrefix + "_stream_type"}
                                value={this.stream_type}
                                optionSet={this.props.stream_type_optionSet}
                            />
                        </div>
                    </div>
                    <div className={"streamPart_title"}>
                        <label htmlFor={this.fieldPrefix + "_stream_title"} className={"control-label"}>Title</label>
                        <div className={"controls"}>
                            <InputStreamTitle
                                ref={
                                    (input) => {
                                        this.streamTitleReference = input;
                                    }
                                }
                                id={this.fieldPrefix + "_stream_title"}
                                value={this.stream_title}
                            />
                        </div>
                    </div>
                    <div className={"streamPart_rightButtons"}>
                        <button
                            ref={
                                (input) => {
                                    this.moveUpReference = input;
                                }
                            }
                            className={"btn btn-mini"}
                            title={"move up"}
                            type={"button"}
                            style={
                                {
                                    visibility: ((this.props.index > 0) ? "visible" : "hidden")
                                }
                            }
                            onClick={
                                (e) => this.props.handleButtonClick(e)
                            }
                        >
                            <i id={this.buttonSetPrefix + "_moveup"} className={"icon-arrow-up"} />
                        </button>
                        <br />

                        <button
                            ref={
                                (input) => {
                                    this.moveDownReference = input;
                                }
                            }
                            className={"btn btn-mini"}
                            title={"move down"}
                            type={"button"}
                            style={
                                {
                                    visibility: ((this.props.index < this.props.maxIndex) ? "visible" : "hidden")
                                }
                            }
                            onClick={
                                (e) => this.props.handleButtonClick(e)
                            }
                        >
                            <i id={this.buttonSetPrefix + "_movedown"} className={"icon-arrow-down"} />
                        </button>
                        <br />

                        <button
                            ref={
                                (input) => {
                                    this.removeReference = input;
                                }
                            }
                            className={"btn btn-mini"}
                            title={"remove"}
                            type={"button"}
                            onClick={
                                (e) => this.props.handleButtonClick(e)
                            }
                        >
                            <i id={this.buttonSetPrefix + "_remove"} className={"icon-remove"} />
                        </button>
                        <br />
                    </div>
                </div>

                <br className={"streamsClearBoth"} />

                <div className={"streamPartDiv"}>
                    <div className={"streamPart_leftConfidenceJudgement"}>
                        <label htmlFor={this.fieldPrefix + "_confidence_judgement_title"} className={"control-label"}>Within-Stream Confidence Judgement<br /><span style={{fontSize:"0.8em",}}>Title</span></label>
                        <div className={"controls"}>
                            <InputConfidenceJudgementTitle
                                ref={
                                    (input) => {
                                        this.confidenceJudgementTitleReference = input;
                                    }
                                }
                                id={this.fieldPrefix + "_confidence_judgement_title"}
                                value={this.confidence_judgement.title}
                            />
                        </div>

                        <label htmlFor={this.fieldPrefix + "_confidence_judgement_score"} className={"control-label"}><span style={{fontSize:"0.8em",}}>Score</span></label>
                        <div className={"controls"}>
                            <SelectConfidenceJudgementScore
                                ref={
                                    (input) => {
                                        this.confidenceJudgementScoreReference = input;
                                    }
                                }
                                id={this.fieldPrefix + "_confidence_judgement_score"}
                                value={this.confidence_judgement.score}
                                optionSet={this.props.confidenceJudgements}
                            />
                        </div>
                    </div>
                    <div className={"streamPart_rightConfidenceJudgement"}>
                        <label htmlFor={this.fieldPrefix + "_confidence_judgement_explanation"} className={"control-label"}><br /><span style={{fontSize:"0.8em",}}>Explanation</span></label>
                        <div className={"controls"}>
                            <TextAreaConfidenceJudgementExplanation
                                ref={
                                    (input) => {
                                        this.confidenceJudgementExplanationReference = input;
                                    }
                                }
                                id={this.fieldPrefix + "_confidence_judgement_explanation"}
                                value={this.confidence_judgement.explanation}
                            />
                        </div>
                    </div>
                </div>

                <br className={"streamsClearBoth"} />

                <div className={"streamPartDiv"}>
                    <div className={"streamPart_outcomes"}>
                        <div
                            ref={
                                (input) => {
                                    this.outcomesFormsetReference = input;
                                }
                            }
                            id={this.fieldPrefix + "_outcomesFormset"}
                        >
                        </div>
                    </div>
                </div>

                <br className={"streamsClearBoth"} />

                <div className={"streamPartDiv"}>
                    <div className={"streamPart_scenarios"}>
                        <div
                            ref={
                                (input) => {
                                    this.scenariosFormsetReference = input;
                                }
                            }
                            id={this.fieldPrefix + "_scenariosFormset"}
                        >
                        </div>
                    </div>
                </div>

                <br className={"streamsClearBoth"} />
            </div>
        );
    }

    buildOutcomesOptionSet() {
        let returnValue = [<option key={0} value={""}>Select Outcome</option>];

        if ((typeof(this.outcomes) === "object") && (Array.isArray(this.outcomes)) && (this.outcomes.length > 0)) {
            let iTo = this.outcomes.length;
            for (let i=0; i<iTo; i++) {
                if ((typeof(this.outcomes[i].title) !== "undefined") && (typeof(this.outcomes[i].score) !== "undefined")) {
                    // Look for the score name corresponding to the score value in this.outcomes[i].score, defaulting to the score value if no
                    // name was found
                    let scoreValueIndex = this.props.confidenceJudgements.values.indexOf(this.outcomes[i].score);
                    let scoreName = (scoreValueIndex >= 0) ? this.props.confidenceJudgements.judgements[scoreValueIndex].name : this.outcomes[i].score;

                    // Push an <option> for this outcome
                    returnValue.push(<option key={i + 1} value={this.outcomes[i].title + "|" + this.outcomes[i].score}>{"title: " + this.outcomes[i].title + ", score: " + scoreName}</option>);
                }
            }
        }

        return returnValue;
    }

    componentDidMount() {
        renderOutcomesFormset(this.outcomes, this.fieldPrefix + "_outcomesFormset", this.props.outcomesFormsetConfig, this.props.confidenceJudgements, this.scenariosFormsetReference, this.updateOutcomesOptionSet);
        renderEvidenceProfileScenariosFormset(this.scenarios, this.fieldPrefix + "_scenariosFormset", this.props.scenariosFormsetConfig, this.props.confidenceJudgements, this.divReference, this.outcomesOptionSet, this.updateOutcomesOptionSet);
    }
}


// This Component class is used to create an input field for a single stream's order within the set of streams
class InputOrder extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        this.state = {
            value: props.value
        };
    }

    updateField(event) {
    }

    // Place the desired input element on the page
    render() {
        return (
            <input
                id={this.props.id}
                type="hidden"
                name={this.props.id}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            />
        );
    }
}


// This Component class is used to create a <select> field for a single Evidence Profile Stream's type
class SelectStreamType extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        // Initialize the set of <option>s for this <select> with an empty "Select Type" value
        this.optionSet = [<option key={0} value={""}>Select Stream Type</option>];

        if (("optionSet" in props) && (typeof(props.optionSet) === "object")) {
            // The incoming props includes an "optionSet" object, iterate through its ordered value array to build the set of
            // <option>s for this <select>

            let iTo = props.optionSet.values.length;
            for (let i=0; i<iTo; i++) {
                this.optionSet.push(<option key={(i + 1)} value={props.optionSet.types[props.optionSet.values[i]].value}>{props.optionSet.types[props.optionSet.values[i]].name}</option>);
            }
        }

        // Set the initial state of this object to the incoming props.value, defaulting to an empty string if it isn't present
        this.state = {
            value: (("value" in props) && (props.value !== null)) ? props.value : ""
        };
    }

    // This method updates the tag's state with the new value of the contained input
    updateField(event) {
        this.setState(
            {
                value: event.target.value
            }
        );
    }

    // The method generates this <select> tag's HTML code for this Component
    render() {
        return (
            <select
                id={this.props.id}
                name={this.props.id}
                required={"required"}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            >
                {this.optionSet}
            </select>
        );
    }
}


// This Component class is used to create an input field for a single Evidence Profile Stream's title
class InputStreamTitle extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        this.state = {
            value: props.value
        };
    }

    // This method update the tag's state with the new value of the contained input
    updateField(event) {
        this.setState(
            {
                value: event.target.value
            }
        );
    }

    // This method generates the HTML code for this Component
    render() {
        return (
            <input
                id={this.props.id}
                className={"span12 textinput textInput"}
                type={"text"}
                maxLength={"50"}
                required={"required"}
                name={this.props.id}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            />
        );
    }
}


// This Component class is used to create an input field for the "Within-Stream" confidence judgment
class InputConfidenceJudgementTitle extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        this.state = {
            value: props.value
        };
    }

    // This method update the tag's state with the new value of the contained input
    updateField(event) {
        this.setState(
            {
                value: event.target.value
            }
        );
    }

    // This method generates the HTML code for this Component
    render() {
        return (
            <input
                id={this.props.id}
                className={"span12 textinput textInput"}
                type={"text"}
                maxLength={"50"}
                required={"required"}
                name={this.props.id}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            />
        );
    }
}


// This Component class is used to create a <select> field for a single Evidence Profile Stream's judgement score
class SelectConfidenceJudgementScore extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        // Initialize the set of <option>s for this <select> with an empty "Select Type" value
        this.optionSet = [<option key={0} value={""}>Select Score</option>];

        if (("optionSet" in props) && (typeof(props.optionSet) === "object")) {
            // The incoming props includes an "optionSet" object, iterate through its ordered value array to build the set of
            // <option>s for this <select>

            let iTo = props.optionSet.values.length;
            for (let i=0; i<iTo; i++) {
                this.optionSet.push(<option key={(i + 1)} value={props.optionSet.judgements[props.optionSet.values[i]].value}>{props.optionSet.judgements[props.optionSet.values[i]].name}</option>);
            }
        }

        // Set the initial state of this object to the incoming props.value, defaulting to an empty string if it isn't present
        this.state = {
            value: (("value" in props) && (props.value !== null)) ? props.value : ""
        };
    }

    // This method updates the tag's state with the new value of the contained input
    updateField(event) {
        this.setState(
            {
                value: event.target.value
            }
        );
    }

    // The method generates this <select> tag's HTML code for this Component
    render() {
        return (
            <select
                id={this.props.id}
                name={this.props.id}
                required={"required"}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            >
                {this.optionSet}
            </select>
        );
    }
}


// This Component class is used to create a textarea field for a stream's confidence judgement explanation
class TextAreaConfidenceJudgementExplanation extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        this.state = {
            value: props.value
        };
    }

    // Update the tag's state with the new value of the contained textarea
    updateField(event) {
        this.setState(
            {
                value: event.target.value
            }
        );
    }

    // Place the desired textarea on the page
    render() {
        return (
            <textarea
                id={this.props.id}
                className={"span12"}
                cols={"40"}
                rows={"4"}
                required={"required"}
                name={this.props.id}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            >
            </textarea>
        );
    }
}


// This function is used to create and then populate the <div> element in the Evidence Profile form that will hold and manage the formset for the
// individual Evidence Profile Streams
export function renderEvidenceProfileStreamsFormset(streams, formConfig, streamsConfig) {
    // First, look for the <div> element in the Evidence Profile form that holds the profile's caption -- the Streams'  formset will be just
    // beneath the caption
    let captionDivList = document.querySelectorAll("#" + formConfig.captionDiv);
    if (captionDivList.length > 0) {
        // The desired element was found in the page, attempt to add the new element as desired

        captionDivList[0].insertAdjacentHTML("afterend", '<hr style="margin-top:32px; border-width:1px;" /><div id="' + streamsConfig.divId + '" style="font-size:0.9em; margin:0 0 32px 0; padding:0"></div>');
        ReactDOM.render(
            <EvidenceProfileStreamsFormset streams={streams} config={streamsConfig} confidenceJudgements={formConfig.confidenceJudgements} />,
            document.getElementById(streamsConfig.divId)
        );
    }
}

export default EvidenceProfileStreamsFormset;
