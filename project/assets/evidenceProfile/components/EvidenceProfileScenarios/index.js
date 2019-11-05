import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import EvidenceProfileScenario from "../../EvidenceProfileScenario";

import "./index.css";

// Set the colors to be used as shades for the alternating outcomes within this stream
let shade1 = "#E9E9FF";
let shade2 = "#CFCFFF";

// This Component object is the container for this entire Outcomes formset
class EvidenceProfileScenariosFormset extends Component {
    scenarios = [];
    scenarioReferences = {};

    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        // Set some variables that will be used within this Component
        this.addButtonId = props.config.addButtonIdPattern.replace(/<<streamIndex>>/, this.props.streamIndex);
        this.divId = props.config.divIdPattern.replace(/<<streamIndex>>/, this.props.streamIndex);
        this.fieldPrefix = props.config.fieldPrefixPattern.replace(/<<streamIndex>>/, this.props.streamIndex);
        this.buttonSetPrefix = props.config.buttonSetPrefixPattern.replace(/<<streamIndex>>/, this.props.streamIndex);

        // Bind the desired class functions to this object
        this.handleButtonClick = this.handleButtonClick.bind(this);

        // First, look for a "streams" object in the incoming props -- defaulting to an empty array if none is found
        let iterateOverScenarios = (("scenarios" in props) && (typeof(props.scenarios) === "object") && (props.scenarios !== null)) ? props.scenarios : [];

        // Iterate over the incoming cenarios and use them to build the object level "scenarios" and "scenarioReferences" attributes
        let iTo = iterateOverScenarios.length;
        for (let i=0; i<=iTo; i++) {
            this.scenarios.push(
                {
                    scenario: (i < iTo) ? iterateOverScenarios[i] : (new EvidenceProfileScenario()),
                    caption: null,
                    div: null,
                }
            );
        }

        // Iterate through this.scenarios to create the caption and detail <div>s
        for (let i=0; i<=iTo; i++) {
            // Create a new ScenarioCaption for this scenario and place it into the scenario's "caption" attribute
            this.scenarios[i].caption = <ScenarioCaption
                key={(i + 0.5)}
                ref={
                    (input) => {
                        this.scenarioReferences["caption_" + i] = input;
                    }
                }
                index={i}
                maxIndex={iTo}
                order={(i + 1)}
                scenario_name={this.scenarios[i].scenario.object.scenario_name}
                divId={this.divId}
                idPrefix={this.props.config.scenarioIdPrefix}
                buttonSetPrefix={this.buttonSetPrefix}
                handleButtonClick={this.handleButtonClick}
            />;

            // Set the simple, pipe-delimited value for the outcome form field based on the scenario's JSON-formatted outcome object attribute
            let outcome = ((i < iTo) && ("title" in this.scenarios[i].scenario.object.outcome)) ? this.scenarios[i].scenario.object.outcome.title + "|" + this.scenarios[i].scenario.object.outcome.score : "";

            // Create a new ScenarioDiv for this scenario and place it into the scenario's "div" attribute
            this.scenarios[i].div = <ScenarioDiv
                key={i}
                ref={
                    (input) => {
                        this.scenarioReferences["div_" + i] = input;
                    }
                }
                index={i}
                maxIndex={iTo}
                order={(i + 1)}
                pk={this.scenarios[i].scenario.object.pk}
                streamIndex={this.props.streamIndex}
                scenario_name={this.scenarios[i].scenario.object.scenario_name}
                outcome={outcome}
                outcomes_optionSet={this.props.outcomesOptionSet}
                studies={this.scenarios[i].scenario.object.studies}
                confidencefactors_increase={this.scenarios[i].scenario.object.confidencefactors_increase}
                confidencefactors_increase_optionSet={this.props.config.confidenceFactorsIncrease}
                confidenceFactors_decrease={this.scenarios[i].scenario.object.confidencefactors_decrease}
                confidenceFactors_decrease_optionSet={this.props.config.confidenceFactorsDecrease}
                summary_of_findings={this.scenarios[i].scenario.object.summary_of_findings}
                confidenceJudgements={this.props.confidenceJudgements}
                divId={this.divId}
                idPrefix={this.props.config.scenarioIdPrefix}
                fieldPrefix={this.fieldPrefix}
                buttonSetPrefix={this.buttonSetPrefix}
                handleButtonClick={this.handleButtonClick}
                scenarioReferences={this.scenarioReferences}
            />;
        }

        // Initialize this object state's "div" to the initial set of divs from this.streams
        this.state = {
            divs: this.buildDivs(),
        };
    }

    // This method generates the HTML that replaces this object's JSX representation
    render() {
        return(
            <div id={this.divId}>
                <strong className="control-label">Profile Stream Scenarios</strong>
                <button id={this.addButtonId} className="btn btn-primary pull-right" type="button" onClick={this.handleButtonClick}>New Scenario</button>
                <br className="scenariosClearBoth" />
                {this.state.divs}
            </div>
        );
    }

    // This function handles the clicking of a button within this formset
    handleButtonClick(event) {
        if ((typeof(event) == "object") && (typeof(event.target) == "object") && (typeof(event.target.id) == "string") && (event.target.id != "")) {
            // The click event's details were passed in, and the clicked-upon element has a non-empty ID attribute, continue checking

            if (event.target.id === this.addButtonId) {
                // The element clicked upon is the "Add A New Scenario" button, add a new scenario to this.scenarios and this.scenarioReferences

                // Get values that will be used within props for the new scenario <div>
                let newDivIndex = Math.max(...this.scenarios.map(scenario => scenario.div.props.index)) + 1;
                let scenarioIndex = this.scenarios.length;

                // Push a new, empty scenario into this.scenarios
                this.scenarios.push(
                    {
                        scenario: new EvidenceProfileScenario(),
                        caption: null,
                        div: null,
                    }
                );

                // Create the new ScenarioCaption component object
                this.scenarios[scenarioIndex].caption = <ScenarioCaption
                    key={(newDivIndex + 0.5)}
                    ref={
                        (input) => {
                            this.scenarioReferences["caption_" + newDivIndex] = input;
                        }
                    }
                    index={newDivIndex}
                    maxIndex={newDivIndex}
                    order={(newDivIndex + 1)}
                    scenario_name={this.scenarios[scenarioIndex].scenario.object.scenario_name}
                    divId={this.divId}
                    idPrefix={this.props.config.scenarioIdPrefix}
                    buttonSetPrefix={this.buttonSetPrefix}
                    handleButtonClick={this.handleButtonClick}
                />;

                // Create the new ScenarioDiv component object
                this.scenarios[scenarioIndex].div = <ScenarioDiv
                    key={newDivIndex}
                    ref={
                        (input) => {
                            this.scenarioReferences["div_" + newDivIndex] = input;
                        }
                    }
                    index={newDivIndex}
                    maxIndex={newDivIndex}
                    order={(newDivIndex + 1)}
                    streamIndex={this.props.streamIndex}
                    scenario_name={this.scenarios[scenarioIndex].scenario.object.scenario_name}
                    outcome={""}
                    outcomes_optionSet={this.props.outcomesOptionSet}
                    studies={this.scenarios[scenarioIndex].scenario.object.studies}
                    confidencefactors_increase={this.scenarios[scenarioIndex].scenario.object.confidencefactors_increase}
                    confidencefactors_increase_optionSet={this.props.config.confidenceFactorsIncrease}
                    confidenceFactors_decrease={this.scenarios[scenarioIndex].scenario.object.confidencefactors_decrease}
                    confidenceFactors_decrease_optionSet={this.props.config.confidenceFactorsDecrease}
                    summary_of_findings={this.scenarios[scenarioIndex].scenario.object.summary_of_findings}
                    confidenceJudgements={this.props.confidenceJudgements}
                    divId={this.divId}
                    idPrefix={this.props.config.scenarioIdPrefix}
                    fieldPrefix={this.fieldPrefix}
                    buttonSetPrefix={this.buttonSetPrefix}
                    handleButtonClick={this.handleButtonClick}
                    scenarioReferences={this.scenarioReferences}
                />;

                // Set this.state.rows to the new inference rows array (inclding the new inference added to the end)
                this.setState(
                    {
                        divs: this.buildDivs(),
                    }
                );
            }
            else {
                // The element clicked upon is either a "Move Up," "Move Down" or "Remove" button from a <div> within the formset, attempt
                // to handle it

                let countScenarios = this.scenarios.length;
                let buttonDetails = event.target.id.replace(this.props.config.buttonSetRegEx, "$1,$2,$3").split(",");
                if ((buttonDetails.length == 3) && (buttonDetails[0] !== "") && (buttonDetails[1] !== "") && (buttonDetails[2] !== "")) {
                    // Three non-empty details were extracted from the clicked-upon element's ID, continue

                    buttonDetails[0] = parseInt(buttonDetails[0]);
                    buttonDetails[1] = parseInt(buttonDetails[1]);
                    if ((buttonDetails[0] === this.props.streamIndex) && (buttonDetails[1] >= 1)) {
                        // The first button detail matches the streamIndex, and the second button detail is a potentially valid index for a Scenario div

                        let scenarioIndex = this.findScenarioIndex(buttonDetails[1]);
                        if (scenarioIndex > -1) {
                            // The <div> was found within this.scenarios, keep working with it

                            buttonDetails[2] = buttonDetails[2].toLowerCase();
                            if ((buttonDetails[2] === "moveup") && (this.props.streamIndex > 0)) {
                                // The user clicked on the "Move Up" button and the scenario is not at the top of the list, move it up in the list

                                let temp = this.scenarios[scenarioIndex];
                                this.scenarios[scenarioIndex] = this.scenarios[scenarioIndex - 1];
                                this.scenarios[scenarioIndex - 1] = temp;

                                this.setState(
                                    {
                                        divs: this.buildDivs(),
                                    }
                                );
                            }
                            else if ((buttonDetails[2] === "movedown") && (scenarioIndex < (this.scenarios.length - 1))) {
                                // The user clicked on the "Move Down" button and the scenario is not at the bottom of the list, move it down
                                // in the list

                                let temp = this.scenarios[scenarioIndex];
                                this.scenarios[scenarioIndex] = this.scenarios[scenarioIndex + 1];
                                this.scenarios[scenarioIndex + 1] = temp;

                                this.setState(
                                    {
                                        divs: this.buildDivs(),
                                    }
                                );
                            }
                            else if (buttonDetails[2] === "remove") {
                                // The user clicked on the "Remove" button, remove the <div>

                                this.scenarios.splice(scenarioIndex, 1);
                                this.setState(
                                    {
                                        divs: this.buildDivs(),
                                    }
                                );
                            }
                            else if (buttonDetails[2] === "showscenario") {
                                // The clicked-upon element is a "Show" button, change the "display" styles for this scenario's caption and
                                // detail <div>s accordingly
                                this.scenarioReferences["caption_" + this.scenarios[scenarioIndex].div.props.index].captionReference.style.display = "none";
                                this.scenarioReferences["div_" + this.scenarios[scenarioIndex].div.props.index].scenarioReference.style.display = "block";
                            }
                            else if (buttonDetails[2] === "hidescenario") {
                                // The clicked-upon element is a "Hide" button, change the "display" styles for this scenario's caption and
                                // detail <div>s accordingly
                                this.scenarioReferences["caption_" + this.scenarios[scenarioIndex].div.props.index].captionReference.style.display = "block";
                                this.scenarioReferences["div_" + this.scenarios[scenarioIndex].div.props.index].scenarioReference.style.display = "none";
                            }
                        }
                    }
                }
            }
        }
    }

    // After this Component has been updated (i.e. a <div> added, removed or moved up/down), this method runs to re-color the <div>s and set
    // button visibility
    componentDidUpdate() {
        let iTo = this.scenarios.length;
        let iMax = iTo - 1;

        for (let i=0; i<iTo; i++) {
            let reference = this.scenarioReferences["div_" + this.scenarios[i].div.props.index];

            // Alternate the <div> color on streams
            reference.scenarioReference.style.backgroundColor = ((i % 2) === 0) ? shade1 : shade2;

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

    // This method attempts to find the array index of the element in this.scenarios that contains the <ScenarioDiv> element
    // whose index is the passed-in argument value
    // The this.scenarios array indices and the ScenarioReference elements' index values are initially the same; but as rows get
    // moved up and down, that changes -- making this method necessary
    findScenarioIndex(index) {
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
                let iTo = this.scenarios.length;

                // Iterate through this.outcomes until we either reach the end or find the element that contains the formset row being sought
                while ((returnValue === -1) && (i < iTo)) {
                    if (this.scenarios[i].div.props.index === index) {
                        // The desired formset div was found, save i as returnValue
                        returnValue = i;
                    }

                    i++;
                }
            }
        }

        return returnValue;
    }

    // This method iterates over this.scenarios and builds an array containing each outcome's caption and detail <div>s
    buildDivs() {
        let returnValue = [];
        let iTo = this.scenarios.length;

        for (let i=0; i<iTo; i++) {
            returnValue.push(this.scenarios[i].caption);
            returnValue.push(this.scenarios[i].div);
        }

        return returnValue;
    }
}


// This object is a single Evidence Profile Scenario caption
class ScenarioCaption extends Component {
    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        this.state = {
            name: (this.props.scenario_name !== null) ? this.props.scenario_name : "",
        }
    }

    render() {
        return(
            <div
                ref={
                    (input) => {
                        this.captionReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + this.props.order + "_caption"}
                style={
                    {
                        display: ((this.props.index < this.props.maxIndex) ? "block" : "none"),
                    }
                }
                className={"scenarioCaptionDiv"}
            >
                <div className={"scenarioCaption_button"}>
                    <button
                        ref={
                            (input) => {
                                this.showScenarioReference = input;
                            }
                        }
                        className={"btn btn-mini showScenarioButton"}
                        title={"show scenario"}
                        type={"button"}
                        onClick={
                            (e) => this.props.handleButtonClick(e)
                        }
                     >
                        <i id={this.props.buttonSetPrefix + "_" + (this.props.index + 1) + "_showscenario"} className={"icon-plus"} />
                    </button>
                </div>
                <div className={"scenarioCaption_name"}>
                    {(this.state.name !== "") ? <strong><em>{this.state.name}</em></strong> : "[No Name Yet]"}
                </div>
            </div>
        );
    }
}


// This object is a single Evidence Profile Scenario form fragment
class ScenarioDiv extends Component {
    constructor(props) {
       // First, call the super-class's constructor

        super(props);

        this.pk = (("pk" in this.props) && (this.props.pk !== null) && (typeof(this.props.pk) === "number")) ? this.props.pk : 0;
        this.scenario_name = (("scenario_name" in this.props) && (this.props.scenario_name !== null)) ? this.props.scenario_name : "";

        this.summary_of_findings = (
            ("summary_of_findings" in this.props)
            && (this.props.summary_of_findings !== null)
            && (typeof(this.props.summary_of_findings) === "object")
            && ("score" in this.props.summary_of_findings)
            && ("explanation" in this.props.summary_of_findings)
        ) ? this.props.summary_of_findings : {
            score: "",
            explanation: "",
        };

        // These fields will get used multiple times each, so it is a good idea to go ahead and declare them
        this.plusOne = this.props.index + 1;
        this.fieldPrefix = this.props.fieldPrefix + "_" + this.plusOne + "_scenario";
        this.buttonSetPrefix = this.props.buttonSetPrefix + "_" + this.plusOne;
    }

    render() {
        return (
            <div
                ref={
                    (input) => {
                        this.scenarioReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + this.props.order}
                className="scenarioDiv"
                style={
                    {
                        backgroundColor:(((this.plusOne % 2) === 0) ? shade2 : shade1),
                        display: ((this.props.index < this.props.maxIndex) ? "none" : "block"),
                    }
                }
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

                <div className={"scenarioDivRow"}>
                    <div className={"scenarioDiv_leftButton"}>
                        <button
                            ref={
                                (input) => {
                                    this.hideScenarioReference = input;
                                }
                            }
                            className={"btn btn-mini"}
                            title={"hide scenario"}
                            type={"button"}
                            onClick={
                                (e) => this.props.handleButtonClick(e)
                            }
                        >
                            <i id={this.buttonSetPrefix + "_hidescenario"} className="icon-minus" />
                        </button>
                    </div>

                    <div className={"scenarioDiv_name"}>
                        <label htmlFor={this.fieldPrefix + "_scenario_name"} className="control-label">Name</label>
                        <div className="controls">
                            <InputScenarioName
                                ref={
                                    (input) => {
                                        this.scenarioNameReference = input;
                                    }
                                }
                                id={this.fieldPrefix + "_scenario_name"}
                                value={this.scenario_name}
                                index={this.props.index}
                                scenarioReferences={this.props.scenarioReferences}
                            />
                        </div>
                    </div>

                    <div className={"scenarioDiv_outcome"}>
                        <label htmlFor={this.fieldPrefix + "_outcome"} className="control-label">Outcome</label>
                        <div className="controls">
                            <SelectOutcome
                                ref={
                                    (input) => {
                                        this.outcomeReference = input;
                                    }
                                }
                                id={this.fieldPrefix + "_outcome"}
                                value={this.props.outcome}
                                optionSet={this.props.outcomes_optionSet}
                            />
                        </div>
                    </div>

                    <div className={"scenarioDiv_rightButtons"}>
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
                    </div>
                </div>

                <br className={"scenariosClearBoth"} />

                <div className={"scenarioPartDiv"}>
                    <div className={"scenarioDiv_leftButton"}>&nbsp;</div>

                    <div className={"scenarioDiv_summaryScore"}>
                        <label htmlFor={this.fieldPrefix + "_summary_of_findings_score"} className="control-label">Summary of Findings<br /><span style={{fontSize:"0.8em",}}>Score</span></label>
                        <div className="controls">
                            <SelectSummaryOfFindingsScore
                                ref={
                                    (input) => {
                                        this.summaryOfFindingsScoreReference = input;
                                    }
                                }
                                id={this.fieldPrefix + "_summary_of_findings_score"}
                                value={this.summary_of_findings.score}
                                optionSet={this.props.confidenceJudgements}
                            />
                        </div>
                    </div>

                    <div className={"scenarioDiv_summaryExplanation"}>
                        <label htmlFor={this.fieldPrefix + "_summary_of_findings_explanation"} className="control-label"><br /><span style={{fontSize:"0.8em",}}>Explanation</span></label>
                        <div className="controls">
                            <TextAreaSummaryOfFindingsExplanation
                                ref={
                                    (input) => {
                                        this.summaryOfFindingsExplanationReference = input;
                                    }
                                }
                                id={this.fieldPrefix + "_summary_of_findings_explanation"}
                                value={this.summary_of_findings.explanation}
                            />
                        </div>
                    </div>
                </div>

                <br className="scenariosClearBoth" />
            </div>
        )
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


// This Component class is used to create an input field for a single Evidence Profile Stream's title
class InputScenarioName extends Component {
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

        // Look for a reference to this parent scenario's companion caption object
        let referenceKey = "caption_" + this.props.index;
        if (
            (typeof(this.props.scenarioReferences) === "object")
            && (referenceKey in this.props.scenarioReferences)
            && (typeof(this.props.scenarioReferences[referenceKey]) === "object")
        ) {
            // The companion caption was found update its state with the value of this title
            this.props.scenarioReferences[referenceKey].setState(
                {
                    name: event.target.value,
                }
            );
        }
    }

    // This method generates the HTML code for this Component
    render() {
        return (
            <input
                id={this.props.id}
                className="span12 textinput textInput"
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


// This Component class is used to create a <select> field for a single Evidence Profile Stream's type
class SelectOutcome extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        // Set the initial state of this object to the incoming props.value, defaulting to an empty string if it isn't present
        this.state = {
            optionSet: this.props.optionSet,
            value: (("value" in props) && (props.value !== null)) ? props.value : "",
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
                className="scenarioOutcome"
                required={"required"}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            >
                {this.state.optionSet}
            </select>
        );
    }
}


// This Component class is used to create a <select> field for a single Evidence Profile Scenario's summary of findings score
class SelectSummaryOfFindingsScore extends Component {
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


// This Component class is used to create a textarea field for a scenario's summary of findings explanation
class TextAreaSummaryOfFindingsExplanation extends Component {
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
export function renderEvidenceProfileScenariosFormset(scenarios, divId, config, confidenceJudgements, outcomesFormsetReference, outcomesOptionSet) {
    // First, look for the <div> element in the Evidence Profile Stream that will hold the Outcomes -- this formset will placed be within that element

    if ((divId !== null) && (divId !== "")) {
        // divId is not null and is not an empty string, continue checking it

        let streamIndex = parseInt(divId.replace(/^stream_(\d+)_scenariosFormset$/, "$1"));
        if ((!isNaN(streamIndex)) && (streamIndex > 0)) {
            // divId matched the desired naming convention and the parent stream's ID was extracted, continue

            let scenariosFormsetDiv = document.getElementById(divId);
            if (scenariosFormsetDiv !== null) {
                // The <div> element intended to hold this formset exists, render it

                ReactDOM.render(
                    <EvidenceProfileScenariosFormset
                        scenarios={scenarios}
                        config={config}
                        streamIndex={streamIndex}
                        confidenceJudgements={confidenceJudgements}
                        outcomesFormsetReference={outcomesFormsetReference}
                        outcomesOptionSet={outcomesOptionSet}
                    />,
                    scenariosFormsetDiv
                );
            }
        }
    }
}

export default EvidenceProfileScenariosFormset;
