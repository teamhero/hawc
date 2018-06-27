import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

import "./index.css";

import {updateOutcomesOptionSet} from "../../../Library"

// This Component object is the container for this entire Outcomes formset
class OutcomesFormset extends Component {
    outcomes = [];
    outcomeReferences = {};

    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        // Set some variables that will be used within this Component
        this.addButtonId = props.config.addButtonIdPattern.replace(/<<streamIndex>>/, this.props.streamIndex);
        this.tableId = props.config.tableIdPattern.replace(/<<streamIndex>>/, this.props.streamIndex);
        this.outcomeIdPrefix = props.config.outcomeIdPrefixPattern.replace(/<<streamIndex>>/, this.props.streamIndex);
        this.fieldPrefix = props.config.fieldPrefixPattern.replace(/<<streamIndex>>/, this.props.streamIndex);
        this.buttonSetPrefix = props.config.buttonSetPrefixPattern.replace(/<<streamIndex>>/, this.props.streamIndex);

        // Bind the desired class functions to this object
        this.handleButtonClick = this.handleButtonClick.bind(this);

        // First, look for an "outcomes" object in the incoming props -- defaulting to an empty array if none is found
        let iterateOverOutcomes = (("outcomes" in props) && (typeof(props.outcomes) === "object") && (props.outcomes !== null)) ? props.outcomes : [];

        // Iterate over the incoming outcomes and use them to build the object level "outcomes" and "outcomeReferences" attribures
        let iTo = iterateOverOutcomes.length;
        for (let i=0; i<=iTo; i++) {
            this.outcomes.push(
                {
                    outcome: (i < iTo) ? iterateOverOutcomes[i] : ({title:"", score: "", explanation:""}),
                    row: null,
                }
            );
        }

        // Iterate through this.outcomes and create a new OUtcomeRow for that ouctome and place it into the outcome's "row" attribute
        for (let i=0; i<=iTo; i++) {
            this.outcomes[i].row = <OutcomeRow
                key={i}
                ref={
                    (input) => {
                        this.outcomeReferences["row_" + i] = input;
                    }
                }
                index={i}
                maxIndex={iTo}
                order={(i + 1)}
                streamIndex={this.props.streamIndex}
                title={this.outcomes[i].outcome.title}
                score={this.outcomes[i].outcome.score}
                explanation={this.outcomes[i].outcome.explanation}
                idPrefix={this.outcomeIdPrefix}
                fieldPrefix={this.fieldPrefix}
                buttonSetPrefix={this.buttonSetPrefix}
                buttonSetRegEx={this.props.config.buttonSetRegEx}
                confidenceJudgements={this.props.confidenceJudgements}
                handleButtonClick={this.handleButtonClick}
            />;
        }

        this.state = {
            rows: this.outcomes.map(outcome => outcome.row),
        }
    }

    render() {
        // Set the basic styles for each of the columns used within this formset
        let columnStyles = [
            {

                width: "204px",
            }
            ,{
                width: "336px",
            }
            ,{
                width: "40px",
            }
        ];

        return(
            <div>
                <strong className="control-label">Outcomes Used Within This Profile Stream</strong>
                <button id={this.addButtonId} className="btn btn-primary pull-right" type="button" onClick={this.handleButtonClick}>New Outcome</button>
                <br className="outcomesClearBoth" />
                <table id={this.tableId} className="outcomesTable">
                    <tbody>
                        {this.state.rows}
                    </tbody>
                </table>
            </div>
        );
    }

    // This function handles the clicking of a button within this formset
    handleButtonClick(event) {
        if ((typeof(event) == "object") && (typeof(event.target) == "object") && (typeof(event.target.id) == "string") && (event.target.id != "")) {
            // The click event's details were passed in, and the clicked-upon element has a non-empty ID attribute, continue checking

            if (event.target.id === this.addButtonId) {
                // The element clicked upon is the "Add A New Outcome" button, add a new stream to this.outcomes and this.outcomeReferences

                // Get values that will be used within props for the new inference row
                let newRowIndex = Math.max(...this.outcomes.map(outcome => outcome.row.props.index)) + 1;
                let outcomeIndex = this.outcomes.length;

                // Push a new, empty inference into this.inferences
                this.outcomes.push(
                    {
                        outcome: {
                            title: "",
                            score: "",
                            explanation: "",
                        },
                        row: null
                    }
                );

                // Create the new CrossStreamInferenceRow component object
                this.outcomes[outcomeIndex].row = <OutcomeRow
                    key={newRowIndex}
                    ref={
                        (input) => {
                            this.outcomeReferences["row_" + newRowIndex] = input;
                        }
                    }
                    index={newRowIndex}
                    maxIndex={newRowIndex}
                    order={(newRowIndex + 1)}
                    streamIndex={this.props.streamIndex}
                    title={this.outcomes[outcomeIndex].outcome.title}
                    score={this.outcomes[outcomeIndex].outcome.score}
                    explanation={this.outcomes[outcomeIndex].outcome.explanation}
                    idPrefix={this.outcomeIdPrefix}
                    fieldPrefix={this.fieldPrefix}
                    buttonSetPrefix={this.buttonSetPrefix}
                    buttonSetRegEx={this.props.config.buttonSetRegEx}
                    confidenceJudgements={this.props.confidenceJudgements}
                    handleButtonClick={this.handleButtonClick}
                />;

                // Set this.state.rows to the new inference rows array (inclding the new inference added to the end)
                this.setState(
                    {
                        rows: this.outcomes.map(outcome => outcome.row),
                    }
                );
            }
            else if (event.target.id.match(this.props.config.buttonSetRegEx)) {
                // The element clicked upon is either a "Move Up," "Move Down" or "Remove" button from a row within the formset, attempt
                // to handle it

                let countOutcomes = this.outcomes.length;
                let buttonDetails = event.target.id.replace(this.props.config.buttonSetRegEx, "$1,$2,$3").split(",");
                if ((buttonDetails.length == 3) && (buttonDetails[0] !== "") && (buttonDetails[1] !== "") && (buttonDetails[2] !== "")) {
                    // Three non-empty details were extracted from the clicked-upon element's ID, continue

                    buttonDetails[0] = parseInt(buttonDetails[0]);
                    buttonDetails[1] = parseInt(buttonDetails[1]);
                    if ((buttonDetails[0] === this.props.streamIndex) && (buttonDetails[1] >= 1)) {
                        // The first button detail matches the streamIndex, and the second button detail is a potentially valid index for an Outcome row

                        let outcomeIndex = this.findOutcomeIndex(buttonDetails[1]);
                        if (outcomeIndex > -1) {
                            // The row was found within this.outcomes, keep working with it

                            buttonDetails[2] = buttonDetails[2].toLowerCase();
                            if ((buttonDetails[2] === "moveup") && (this.props.streamIndex > 0)) {
                                // The user clicked on the "Move Up" button and the outcome is not at the top of the list, move it up in the list

                                let temp = this.outcomes[outcomeIndex];
                                this.outcomes[outcomeIndex] = this.outcomes[outcomeIndex - 1];
                                this.outcomes[outcomeIndex - 1] = temp;

                                this.setState(
                                    {
                                        rows: this.outcomes.map(outcome => outcome.row),
                                    }
                                );
                            }
                            else if ((buttonDetails[2] === "movedown") && (outcomeIndex < (this.outcomes.length - 1))) {
                                // The user clicked on the "Move Down" button and the outcome is not at the bottom of the list, move it down
                                // in the list

                                let temp = this.outcomes[outcomeIndex];
                                this.outcomes[outcomeIndex] = this.outcomes[outcomeIndex + 1];
                                this.outcomes[outcomeIndex + 1] = temp;

                                this.setState(
                                    {
                                        rows: this.outcomes.map(outcome => outcome.row),
                                    }
                                );
                            }
                            else if (buttonDetails[2] === "remove") {
                                // The user clicked on the "Remove" button, remove the <tr>

                                this.outcomes.splice(outcomeIndex, 1);
                                this.setState(
                                    {
                                        rows: this.outcomes.map(outcome => outcome.row),
                                    }
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    // After this Component has been updated (i.e. a <tr> added, removed or moved up/down), this method runs to re-color the rows and set
    // button visibility
    componentDidUpdate() {
        let iTo = this.outcomes.length;
        let iMax = iTo - 1;
        for (let i=0; i<iTo; i++) {
            let reference = this.outcomeReferences["row_" + this.outcomes[i].row.props.index];

            // Alternate the <div> color on streams
            reference.outcomeReference.style.backgroundColor = ((i % 2) === 1) ? "#EEEEEE" : "#FFFFFF";

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

        // Update the set of outcom <option>s available with this parent stream
        updateOutcomesOptionSet(this.props.streamIndex);
    }

    // This method attempts to find the array index of the element in this.outcomes that contains the OutcomeRow element
    // whose index is the passed-in argument value
    // The this.outcomes array indices and the OutcomeReference elements' index values are initially the same; but as rows get
    // moved up and down, that changes -- making this method necessary
    findOutcomeIndex(index) {
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
                let iTo = this.outcomes.length;

                // Iterate through this.outcomes until we either reach the end or find the element that contains the formset row being sought
                while ((returnValue === -1) && (i < iTo)) {
                    if (this.outcomes[i].row.props.index === index) {
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


// This Component class is used to manage a single Outcome row within this Outcomes formset
class OutcomeRow extends Component {
    constructor(props) {
        // First, call the super-class's constructor
        super(props);

        // These fields will get used multiple times each, so it is a good idea to go ahead and declare them
        this.plusOne = this.props.index + 1;
        this.fieldPrefix = this.props.fieldPrefix + "_" + this.plusOne + "_outcome";
        this.buttonSetPrefix = this.props.buttonSetPrefix + "_" + this.plusOne;
    }

    render() {
        return(
            <tr
                ref={
                    (input) => {
                        this.outcomeReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + this.plusOne}
                className="outcomesBodyRow"
                style={
                    {
                        backgroundColor: ((this.props.index % 2) === 1) ? "#EEEEEE" : "#FFFFFF",
                    }
                }
            >
                <td className="outcomesBodyCell">
                    <InputOrder
                        ref={
                            (input) => {
                                this.orderReference = input;
                            }
                        }
                        id={this.fieldPrefix + "_order"}
                        value={this.props.order}
                    />

                    <label htmlFor={this.fieldPrefix + "_title"} className="control-label">Title</label>
                    <div className="controls">
                        <InputTitle
                            ref={
                                (input) => {
                                    this.titleReference = input;
                                }
                            }
                            id={this.fieldPrefix + "_title"}
                            value={this.props.title}
                            streamIndex={this.props.streamIndex}
                        />
                    </div>

                    <label htmlFor={this.fieldPrefix + "_score"} className="control-label">Score</label>
                    <div className="controls">
                        <SelectScore
                            ref={
                                (input) => {
                                    this.scoreReference = input;
                                }
                            }
                            id={this.fieldPrefix + "_score"}
                            value={this.props.score}
                            optionSet={this.props.confidenceJudgements}
                            streamIndex={this.props.streamIndex}
                        />
                    </div>
                </td>
                <td className="outcomesBodyCell">
                    <label htmlFor={this.fieldPrefix + "_explanation"} className="control-label">Explanation</label>
                    <div className="controls">
                        <TextAreaExplanation
                            ref={
                                (input) => {
                                    this.explanationReference = input;
                                }
                            }
                            id={this.fieldPrefix + "_explanation"}
                            value={this.props.explanation}
                        />
                    </div>
                </td>
                <td className="outcomesBodyCell">
                    <button
                        ref={
                            (input) => {
                                this.moveUpReference = input;
                            }
                        }
                        className="btn btn-mini"
                        title="move up"
                        type="button"
                        style={
                            {
                                visibility: ((this.props.index > 0) ? "visible" : "hidden")
                            }
                        }
                        onClick={
                            (e) => this.props.handleButtonClick(e)
                        }
                    >
                        <i id={this.buttonSetPrefix + "_moveup"} className="icon-arrow-up" />
                    </button>
                    <br />

                    <button
                        ref={
                            (input) => {
                                this.moveDownReference = input;
                            }
                        }
                        className="btn btn-mini"
                        title="move down"
                        type="button"
                        style={
                            {
                                visibility: ((this.props.index < this.props.maxIndex) ? "visible" : "hidden")
                            }
                        }
                        onClick={
                            (e) => this.props.handleButtonClick(e)
                        }
                    >
                        <i id={this.buttonSetPrefix + "_movedown"} className="icon-arrow-down" />
                    </button>
                    <br />

                    <button
                        ref={
                            (input) => {
                                this.removeReference = input;
                            }
                        }
                        className="btn btn-mini"
                        title="remove"
                        type="button"
                        onClick={
                            (e) => this.props.handleButtonClick(e)
                        }
                    >
                        <i id={this.buttonSetPrefix + "_remove"} className="icon-remove" />
                    </button>
                    <br />
                </td>
            </tr>
        );
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
                className="outcomesInputOrder"
                type="hidden"
                name={this.props.id}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            />
        );
    }
}


// This Component class is used to create an input field for the "Within-Stream" confidence judgment
class InputTitle extends Component {
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

        // Update the set of outcom <option>s available with this parent stream
        updateOutcomesOptionSet(this.props.streamIndex);
    }

    // This method generates the HTML code for this Component
    render() {
        return (
            <input
                id={this.props.id}
                className="span12 textinput textInput outcomesInputTitle"
                type="text"
                maxLength="50"
                required="required"
                name={this.props.id}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            />
        );
    }
}


// This Component class is used to create a <select> field for a single Evidence Profile Stream's judgement score
class SelectScore extends Component {
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

        // Update the set of outcom <option>s available with this parent stream
        updateOutcomesOptionSet(this.props.streamIndex);
    }

    // The method generates this <select> tag's HTML code for this Component
    render() {
        return (
            <select
                id={this.props.id}
                className="outcomesSelectScore"
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
class TextAreaExplanation extends Component {
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
                className="span12"
                cols="40"
                rows="4"
                required="required"
                name={this.props.id}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            >
            </textarea>
        );
    }
}


// This function is used to create and then populate the <div> element in the Evidence Profile form that will hold and manage the formset for the
// Outomes within an individual Evidence Profile Stream
export function renderOutcomesFormset(outcomes, divId, config, confidenceJudgements, scenariosFormsetReference) {
    // First, look for the <div> element in the Evidence Profile Stream that will hold the Outcomes -- this formset will placed be within that element
    if ((divId !== null) && (divId !== "")) {
        // divId is not null and is not an empty string, continue checking it

        let streamIndex = parseInt(divId.replace(/^stream_(\d+)_outcomesFormset$/, "$1"));
        if ((!isNaN(streamIndex)) && (streamIndex > 0)) {
            // divId matched the desired naming convention and the parent stream's ID was extreacted, continue

            let outcomesFormsetDiv = document.getElementById(divId);
            if (outcomesFormsetDiv !== null) {
                // The <div> element intended to hold this formset exists, render it

                ReactDOM.render(
                    <OutcomesFormset
                        outcomes={outcomes}
                        config={config}
                        streamIndex={streamIndex}
                        confidenceJudgements={confidenceJudgements}
                        scenariosFormsetReference={scenariosFormsetReference}
                    />,
                    outcomesFormsetDiv
                );
            }
        }
    }
}

export default OutcomesFormset;
