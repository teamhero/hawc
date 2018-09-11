import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

import "./index.css";

// This Component object is the container for an entire Confidence Factors formset
class ConfidenceFactorsFormset extends Component {
	confidenceFactors = [];
	confidenceFactorReferences = {};

    types = {
        increase: {
            name: "increase",
            proper: "Increase",
            shade1: "#E9FFE9",
            shade2: "#CFFFCF",
        },
        decrease: {
            name: "decrease",
            proper: "Decrease",
            shade1: "#FFE9E9",
            shade2: "#FFCFCF",
        },
    };

    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        // Create a set of variables that need to be initialized within this constructor, along with the incoming regular expressions that will be used 
        // to initialize them
        let variablesToCreate = {
            addButtonId: props.config.addButtonIdPattern,
            tableId: props.config.tableIdPattern,
            confidenceFactorIdPrefix: props.config.confidenceFactorIdPrefixPattern,
            fieldPrefix: props.config.fieldPrefixPattern,
            buttonSetPrefix: props.config.buttonSetPrefixPattern,
        };

        for (let i in variablesToCreate) {
        	this[i] = variablesToCreate[i].replace(/<<streamIndex>>/gi, this.props.streamIndex).replace(/<<scenarioIndex>>/gi, this.props.scenarioIndex);
        }

        // Bind the desired class functions to this object
        this.handleButtonClick = this.handleButtonClick.bind(this);

        if (("type" in this.props) && (typeof(this.props.type) === "string") && (this.props.type in this.types)) {
        	// The passed-in type value is value, continue, do the work to build this formset

	        // First, look for a "studies" object in the incoming props -- defaulting to an empty array if none is found
    	    let iterateOverConfidenceFactors = (("confidenceFactors" in props) && (typeof(props.confidenceFactors) === "object") && (props.confidenceFactors !== null) && (Array.isArray(props.confidenceFactors))) ? props.confidenceFactors : [];

        	// Iterate over the incoming Confidence Factors and use them to build the object level "confidenceFactors" and "confidenceFactorReferences" attributes
	        let iTo = iterateOverConfidenceFactors.length;
    	    for (let i=0; i<iTo; i++) {
        	    let confidenceFactor = iterateOverConfidenceFactors[i];

            	this.confidenceFactors.push(
                	{
                    	id: confidenceFactor.confidencefactor_id,
                    	title: confidenceFactor.name,
	                    explanation: confidenceFactor.explanation,
    	                caption: null,
        	            tr: null,
            	    }
	            );
    	    }

        	if (iTo == 0) {
            	// This Scenario has no Confidence Factors of this type yet, push an empty Confidence Factor onto the end of this.confidenceFactors and increment iTo

	            this.confidenceFactors.push(
    	            {
        	            id: null,
        	            title: null,
            	        explanation: null,
                	    caption: null,
                    	tr: null,
	                }
    	        );

        	    iTo++;
	        }

    	    // Iterate through this.confidenceFactors to create the caption and detail <tr>s
        	for (let i=0; i<iTo; i++) {
            	// Create a new ConfidenceFactorCaption for this confidenceFactor and place it into the confidenceFactor's "caption" attribute
	            this.confidenceFactors[i].caption = <ConfidenceFactorCaption
    	            key={(i + 0.5)}
        	        ref={
            	        (input) => {
                	        this.confidenceFactorReferences["caption_" + i] = input;
                    	}
	                }
    	            index={i}
        	        maxIndex={iTo}
            	    order={(i + 1)}
                    type={this.types[this.props.type]}
                	title={this.confidenceFactors[i].title}
	                tableId={this.tableId}
    	            idPrefix={this.confidenceFactorIdPrefix}
        	        buttonSetPrefix={this.buttonSetPrefix}
            	    handleButtonClick={this.handleButtonClick}
	            />;

    	        // Create a new ConfidenceFactorRow for this confidenceFactor and place it into the confidenceFactor's "tr" attribute
        	    this.confidenceFactors[i].tr = <ConfidenceFactorRow
            	    key={i}
                	ref={
                    	(input) => {
                        	this.confidenceFactorReferences["tr_" + i] = input;
	                    }
    	            }
        	        index={i}
            	    maxIndex={(iTo - 1)}
                	order={(i + 1)}
                    type={this.types[this.props.type]}
	                pk={this.confidenceFactors[i].id}
    	            streamIndex={this.props.streamIndex}
        	        scenarioIndex={this.props.scenarioIndex}
            	    title={this.confidenceFactors[i].title}
                	explanation={this.confidenceFactors[i].explanation}
    	            confidenceFactors_optionSet={this.props.config.confidenceFactors}
            	    tableId={this.tableId}
                	idPrefix={this.confidenceFactorIdPrefix}
	                fieldPrefix={this.fieldPrefix}
    	            buttonSetPrefix={this.buttonSetPrefix}
        	        handleButtonClick={this.handleButtonClick}
            	    confidenceFactorReferences={this.confidenceFactorReferences}
	            />;
    	    }
	    }

        // Initialize this object state's "div" to the initial set of divs from this.confidenceFactors
        this.state = {
            rows: this.buildRows(),
        };
    }

    // This method generates the HTML that replaces this object's JSX representation
    render() {
        return(
            <div id={this.divId}>
                <strong className="control-label confidenceFactorsSectionTitle">Factors That <span className={"confidenceFactors" + this.types[this.props.type].proper + "SectionTitleType"}>{this.types[this.props.type].proper}</span> Confidence In The Selected Studies</strong>
                <button id={this.addButtonId} className="btn btn-primary pull-right" type="button" onClick={this.handleButtonClick}>New Factor</button>
                <br className="confidenceFactorsClearBoth" />
                <table id={this.tableid} className={"confidenceFactorsTable"}>
                    <tbody>
                        {this.state.rows}
                    </tbody>
                </table>
            </div>
        );
    }

    // This function handles the clicking of a button within this formset
    handleButtonClick(event) {
        if ((typeof(event) === "object") && (typeof(event.target) === "object") && (typeof(event.target.id) === "string") && (event.target.id !== "")) {
            // The click event's details were passed in, and the clicked-upon element has a non-empty ID attribute, continue checking

            if (event.target.id === this.addButtonId) {
                // The element clicked upon is the "Add A New Factor" button, add a new confidenceFactor to this.confidenceFactors and this.confidenceFactorReferences

                // Get values that will be used within props for the new confidenceFactor <tr>
                let newRowIndex = (this.confidenceFactors.length > 0) ? (Math.max(...this.confidenceFactors.map(confidenceFactor => confidenceFactor.tr.props.index)) + 1) : 0;
                let confidenceFactorIndex = this.confidenceFactors.length;

                // Push a new, empty confidenceFactor into this.confidenceFactor
                this.confidenceFactors.push(
                    {
                    	id: null,
                    	title: null,
                    	explanaxtion: null,
                        caption: null,
                        tr: null,
                    }
                );

                // Create the new confidenceFactorCaption component object
                this.confidenceFactors[confidenceFactorIndex].caption = <ConfidenceFactorCaption
                    key={(newRowIndex + 0.5)}
                    ref={
                        (input) => {
                            this.confidenceFactorReferences["caption_" + newRowIndex] = input;
                        }
                    }
                    index={newRowIndex}
                    maxIndex={newRowIndex}
                    type={this.types[this.props.type]}
                    order={(newRowIndex + 1)}
                    title={this.confidenceFactors[confidenceFactorIndex].title}
                    tableId={this.tableId}
                    idPrefix={this.confidenceFactorIdPrefix}
                    buttonSetPrefix={this.buttonSetPrefix}
                    handleButtonClick={this.handleButtonClick}
                />;

                // Create the new ConfidenceFactorRow component object
                this.confidenceFactors[confidenceFactorIndex].tr = <ConfidenceFactorRow
                    key={newRowIndex}
                    ref={
                        (input) => {
                            this.confidenceFactorReferences["tr_" + newRowIndex] = input;
                        }
                    }
                    index={newRowIndex}
                    maxIndex={newRowIndex}
                    order={(newRowIndex + 1)}
                    type={this.types[this.props.type]}
                    pk={this.confidenceFactors[confidenceFactorIndex].id}
                    streamIndex={this.props.streamIndex}
                    scenarioIndex={this.props.scenarioIndex}
                    title={this.confidenceFactors[confidenceFactorIndex].title}
                    explanation={this.confidenceFactors[confidenceFactorIndex].explanation}
                    confidenceFactors_optionSet={this.props.config.confidenceFactors}
                    tableId={this.tableId}
                    idPrefix={this.confidenceFactorIdPrefix}
                    fieldPrefix={this.fieldPrefix}
                    buttonSetPrefix={this.buttonSetPrefix}
                    handleButtonClick={this.handleButtonClick}
                    confidenceFactorReferences={this.confidenceFactorReferences}
                />;

                // Set this.state.rows to the new caption and row elements
                this.setState(
                    {
                        rows: this.buildRows(),
                    }
                );
            }
            else {
                // The element clicked upon is either a "Move Up," "Move Down," "Remove," "Show" or "Hide" button from a <div> within the formset,
                // attempt to handle it

                let countConfidenceFactors = this.confidenceFactors.length;
                let buttonDetails = event.target.id.replace(this.props.config.buttonSetRegEx, "$1,$2,$3,$4").split(",");

                if ((buttonDetails.length == 4) && (buttonDetails[0] !== "") && (buttonDetails[1] !== "") && (buttonDetails[2] !== "") && (buttonDetails[3] !== "")) {
                    // Three non-empty details were extracted from the clicked-upon element's ID, continue

                    buttonDetails[0] = parseInt(buttonDetails[0]);
                    buttonDetails[1] = parseInt(buttonDetails[1]);
                    buttonDetails[2] = parseInt(buttonDetails[2]);

                    if ((buttonDetails[0] === this.props.streamIndex) && (buttonDetails[1] === this.props.scenarioIndex) && (buttonDetails[2] >= 1)) {
                        // The first button detail matches the streamIndex, the second button detail matches the scenarioIndex, and the third button detail
                        // is a potentially valid index for an ConfidenceFactor <tr>

                        let confidenceFactorIndex = this.findConfidenceFactorIndex(buttonDetails[2]);
                        if (confidenceFactorIndex > -1) {
                            // The <div> was found within this.confidenceFactors, keep working with it

                            buttonDetails[3] = buttonDetails[3].toLowerCase();
                            if ((buttonDetails[3] === "moveup") && (confidenceFactorIndex > 0)) {
                                // The user clicked on the "Move Up" button and the scenario is not at the top of the list, move it up in the list

                                let temp = this.confidenceFactors[confidenceFactorIndex];
                                this.confidenceFactors[confidenceFactorIndex] = this.confidenceFactors[confidenceFactorIndex - 1];
                                this.confidenceFactors[confidenceFactorIndex - 1] = temp;

                                this.setState(
                                    {
                                        rows: this.buildRows(),
                                    }
                                );
                            }
                            else if ((buttonDetails[3] === "movedown") && (confidenceFactorIndex < (this.confidenceFactors.length - 1))) {
                                // The user clicked on the "Move Down" button and the scenario is not at the bottom of the list, move it down
                                // in the list

                                let temp = this.confidenceFactors[confidenceFactorIndex];
                                this.confidenceFactors[confidenceFactorIndex] = this.confidenceFactors[confidenceFactorIndex + 1];
                                this.confidenceFactors[confidenceFactorIndex + 1] = temp;

                                this.setState(
                                    {
                                        rows: this.buildRows(),
                                    }
                                );
                            }
                            else if (buttonDetails[3] === "remove") {
                                // The user clicked on the "Remove" button, remove the <div>

                                this.confidenceFactors.splice(confidenceFactorIndex, 1);
                                this.setState(
                                    {
                                        rows: this.buildRows(),
                                    }
                                );
                            }
                            else if (buttonDetails[3] === "showconfidencefactor") {
                                // The clicked-upon element is a "Show" button, change the "display" styles for this confidenceFactor's caption and
                                // detail <tr>s accordingly

                                this.confidenceFactorReferences["caption_" + this.confidenceFactors[confidenceFactorIndex].tr.props.index].captionReference.style.display = "none";
                                this.confidenceFactorReferences["tr_" + this.confidenceFactors[confidenceFactorIndex].tr.props.index].confidenceFactorReference.style.display = "table-row";
                            }
                            else if (buttonDetails[3] === "hideconfidencefactor") {
                                // The clicked-upon element is a "Hide" button, change the "display" styles for this confidenceFactor's caption and
                                // detail <tr>s accordingly

                                this.confidenceFactorReferences["caption_" + this.confidenceFactors[confidenceFactorIndex].tr.props.index].captionReference.style.display = "table-row";
                                this.confidenceFactorReferences["tr_" + this.confidenceFactors[confidenceFactorIndex].tr.props.index].confidenceFactorReference.style.display = "none";
                            }
                        }
                    }
                }
            }
        }
    }

    // After this Component has been updated (i.e. a <div> added, removed or moved up/down), this method runs to re-color the <tr>s and set
    // button visibility
    componentDidUpdate() {
        let iTo = this.confidenceFactors.length;
        let iMax = iTo - 1;

        for (let i=0; i<iTo; i++) {
            let reference = this.confidenceFactorReferences["tr_" + this.confidenceFactors[i].tr.props.index];

            // Alternate the <tr> color on confidenceFactors
            reference.confidenceFactorReference.style.backgroundColor = ((i % 2) > 0) ? this.types[this.props.type].shade1 : this.types[this.props.type].shade2;

            // Only make the "Move Up" button visible whenever it is not in the first confidenceFactor
            reference.moveUpReference.style.visibility = (i === 0) ? "hidden" : "visible";

            // Only make the "Move Down" button visible whenever it is not in the last confidenceFactor
            reference.moveDownReference.style.visibility = (i === iMax) ? "hidden" : "visible";

            // Set the value of the ordering <input />'s value for this confidenceFactor's <tr>
            reference.orderReference.setState(
                {
                    value: (i + 1),
                }
            );
        }
    }

    // This method attempts to find the array index of the element in this.confidenceFactor that contains the <ConfidenceFactorRow> element
    // whose index is the passed-in argument value
    // The this.confidenceFactors array indices and the confidenceFactorReference elements' index values are initially the same; but as rows get
    // moved up and down, that changes -- making this method necessary
    findConfidenceFactorIndex(index) {
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
                let iTo = this.confidenceFactors.length;

                // Iterate through this.confidenceFactors until we either reach the end or find the element that contains the formset row being sought
                while ((returnValue === -1) && (i < iTo)) {
                    if (this.confidenceFactors[i].tr.props.index === index) {
                        // The desired formset tr was found, save it as returnValue
                        returnValue = i;
                    }

                    i++;
                }
            }
        }

        return returnValue;
    }

    // This method iterates over this.confidenceFactors and builds an array containing each confidenceFactor's caption and detail <tr>s
    buildRows() {
        let returnValue = [];
        let iTo = this.confidenceFactors.length;

        for (let i=0; i<iTo; i++) {
            returnValue.push(this.confidenceFactors[i].caption);
            returnValue.push(this.confidenceFactors[i].tr);
        }

        return returnValue;
    }
}


// This object is a single Scenario Confidence Factor caption
class ConfidenceFactorCaption extends Component {
    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        this.state = {
            title: (this.props.title !== null) ? this.props.title : "",
        }
    }

    render() {
        return(
            <tr
                ref={
                    (input) => {
                        this.captionReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + this.props.order + "_caption"}
                style={
                    {
                        display: "table-row",
                    }
                }
            >
                <td colSpan={3} className={"confidenceFactors" + this.props.type.proper + "CaptionCell"}>
                    <button
                        ref={
                            (input) => {
                                this.showConfidenceFactorReference = input;
                            }
                        }
                        className={"btn btn-mini showConfidenceFactorButton"}
                        title={"show confidence factor"}
                        type={"button"}
                        onClick={
                            (e) => this.props.handleButtonClick(e)
                        }
                     >
                        <i id={this.props.buttonSetPrefix + "_" + (this.props.index + 1) + "_showconfidencefactor"} className={"icon-plus"} />
                    </button>
                    &nbsp;&nbsp;
                    {(this.state.title !== "") ? <strong><em>{this.state.title}</em></strong> : "[No Title Yet]"}
                </td>
            </tr>
        );
    }
}


// This object is a single Scenario Confidence Factor form fragment
class ConfidenceFactorRow extends Component {
    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        this.pk = (("pk" in this.props) && (this.props.pk !== null) && (typeof(this.props.pk) === "number")) ? this.props.pk : 0;
        this.name = (("name" in this.props) && (this.props.name !== null)) ? this.props.name : "";

        // These fields will get used multiple times each, so it is a good idea to go ahead and declare them
        this.plusOne = this.props.index + 1;
        this.fieldPrefix = this.props.fieldPrefix + "_" + this.plusOne + "_confidenceFactor";
        this.buttonSetPrefix = this.props.buttonSetPrefix + "_" + this.plusOne;
    }

    render() {
        return (
            <tr
                ref={
                    (input) => {
                        this.confidenceFactorReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + this.props.order}
                className="confidenceFactorRow"
                style={
                    {
                        backgroundColor:(((this.plusOne % 2) > 0) ? this.props.type.shade2 : this.props.type.shade1),
                        display: "none",
                    }
                }
            >
                <td className={"confidenceFactorCell confidenceFactorCell_leftButton"}>
                    <button
                        ref={
                            (input) => {
                                this.hideConfidenceFactorReference = input;
                            }
                        }
                        className={"btn btn-mini"}
                        title={"hide confidence factor"}
                        type={"button"}
                        onClick={
                            (e) => this.props.handleButtonClick(e)
                        }
                    >
                        <i id={this.buttonSetPrefix + "_hideconfidencefactor"} className="icon-minus" />
                    </button>
                </td>
                <td className={"confidenceFactorCell confidenceFactorCell_fields"}>
                    <InputOrder
                        ref={
                            (input) => {
                                this.orderReference = input;
                            }
                        }
                        id={this.fieldPrefix + "_order"}
                        value={this.props.order}
                    />

                    <label htmlFor={this.fieldPrefix + "_pk"} className="control-label">Tag</label>
                    <div className="controls">
                        <SelectConfidenceFactor
                            ref={
                                (input) => {
                                    this.confidenceTagNameReference = input;
                                }
                            }
                            id={this.fieldPrefix + "_pk"}
                            value={this.pk}
                            index={this.props.index}
                            optionSet={this.props.confidenceFactors_optionSet}
                            confidenceFactorReferences={this.props.confidenceFactorReferences}
                        />
                    </div>

                    <label htmlFor={this.fieldPrefix + "_explanation"} className="control-label">Explanation <em>(optional)</em></label>
                    <div className="controls">
                        <TextAreaExplanation
                            ref={
                                (input) => {
                                    this.explanationReference = input;
                                }
                            }
                            prefix={this.fieldPrefix}
                            value={(this.props.explanation !== null) ? this.props.explanation : ""}
                        />
                    </div>
                </td>
                <td className={"confidenceFactorCell confidenceFactorCell_rightButtons"}>
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
        )
    }
}


// This Component class is used to create an input field for a single confidenceFactor's order within the set of confidenceFactors
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


// This Component class is used to create a <select> field for a single confidenceFactor's id/name combination
class SelectConfidenceFactor extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        // Initialize the set of <option>s for this <select> with an empty "Select Type" value
        this.optionSet = [<option key={0} value={""}>Select Factor</option>];

        if (("optionSet" in props) && (typeof(props.optionSet) === "object")) {
            // The incoming props includes an "optionSet" object, iterate through its ordered value array to build the set of
            // <option>s for this <select>

            let iTo = props.optionSet.factors.length;
            for (let i=0; i<iTo; i++) {
                this.optionSet.push(<option key={(i + 1)} value={props.optionSet.factors[i].value}>{props.optionSet.factors[i].name}</option>);
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

        if (typeof(this.props.confidenceFactorReferences) === "object") {
            // This element's connection to the appication's confidenceFactorReferences is not NULL, work with it

            // Look for a reference to this conficenceFactor's companion caption object
            let referenceKey = "caption_" + this.props.index;
            if ((referenceKey in this.props.confidenceFactorReferences) && (typeof(this.props.confidenceFactorReferences[referenceKey]) === "object")) {
                // The companion caption was found, update its state with the value of this title
                this.props.confidenceFactorReferences[referenceKey].setState(
                    {
                        title: (event.target.value === "") ? "[No Tag Yet]" : this.props.optionSet.factors[this.props.optionSet.index[event.target.value]].name,
                    }
                );
            }

            // Look for a reference to this conficenceFactor's <select>'s companion <textarea> for optional explanation
            referenceKey = "tr_" + this.props.index;
            if (
                (referenceKey in this.props.confidenceFactorReferences)
                && (typeof(this.props.confidenceFactorReferences[referenceKey]) === "object")
                && ("explanationReference" in this.props.confidenceFactorReferences[referenceKey])
                && (typeof(this.props.confidenceFactorReferences[referenceKey].explanationReference) === "object")
            ) {
                // The companion <textarea> was found, set its value
                this.props.confidenceFactorReferences[referenceKey].explanationReference.setState(
                    {
                        value: (event.target.value === "") ? "" : this.props.optionSet.factors[this.props.optionSet.index[event.target.value]].explanation,
                    }
                );
            }
        }
    }

    // The method generates this <select> tag's HTML code for this Component
    render() {
        return (
            <select
                id={this.props.id}
                name={this.props.id}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            >
                {this.optionSet}
            </select>
        );
    }
}


// This Component class is used to create a textarea field for a single Confidence Factor's explanation
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
                id={this.props.prefix + "_explanation"}
                className="span12"
                cols="40"
                rows="2"
                required="required"
                name={this.props.prefix + "_explanation"}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            >
            </textarea>
        );
    }
}


// This function is used to create and then populate the <div> element in the Evidence Profile form that will hold and manage the formset for a set of
// Confidence Factors within this Scenario
export function renderConfidenceFactorsFormset(type, confidenceFactors, divId, config) {
    // First, look for the <div> element in the Stream Scenario that will hold this set of ConfidenceFactors -- this formset will placed be within that element

    // Make sure that type is a string, defaulting to an empty string
    type = ((type !== null) && (typeof(type) === "string")) ? type.toLowerCase() : "";

    if (
    	((type === "increase") || (type === "decrease"))
    	&& (divId !== null) && (typeof(type) === "string") && (divId !== "")
    ) {
        // divId is not null and is not an empty string, continue checking it

        let indices = divId.replace(new RegExp("^stream_(\\d+)_(\\d+)_scenario_confidenceFactors" + ((type === "increase") ? "Increase" : "Decrease") + "Formset$", "gi"), "$1,$2").split(",");
        if ((indices.length === 2) && (!isNaN(indices[0])) && (indices[0] >= 1) && (!isNaN(indices[1])) && (indices[1] >= 1)) {
        	// divId matches the expected naming convention, and it includes syntactically valid Stream and Scenario indices, continue

       		indices[0] = parseInt(indices[0]);
       		indices[1] = parseInt(indices[1]);

            let confidenceFactorsFormsetDiv = document.getElementById(divId);
            if (confidenceFactorsFormsetDiv !== null) {
            	// The <div> element intended to hold this formset exists, render the formset

                ReactDOM.render(
                    <ConfidenceFactorsFormset
                    	type={type}
                        confidenceFactors={confidenceFactors}
                        streamIndex={indices[0]}
                        scenarioIndex={indices[1]}
                        config={config}
                    />,
                    confidenceFactorsFormsetDiv
                );
            }
		}
	}
}


export default ConfidenceFactorsFormset;
