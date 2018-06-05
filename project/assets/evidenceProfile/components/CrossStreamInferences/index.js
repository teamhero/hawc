import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import "./index.css";

// This Component class is used to manage the Cross-Stream Inferences formset portion of the Evidence Profile form
class CrossStreamInferencesFormset extends Component {
    inferences = [];
    rowReferences = {};

    constructor(props) {
        // First, call the super-class's constructor
        super(props);

        // Bind the desired class functions to this object
        this.handleButtonClick = this.handleButtonClick.bind(this);

        // Get the incoming inferences from the props and save them as an object-level attribute (defaulting to an empty
        // array if no inferences were passed in)
        this.inferences = (("inferences" in props) && (typeof(props.inferences) === "object") && (props.inferences !== null)) ? props.inferences : [];
        let iTo = this.inferences.length;
        for (let i=0; i<iTo; i++) {
            this.inferences[i]["row"] = null;
        }

        // Push an empty inference onto the end of the array
        this.inferences.push(
            {
                title: "",
                description: "",
                row: null,
            }
        );

        // Iterate through this.inferences and create a new CrossStreamInferenceRow for that inference and place it into the
        // inference's "row" attribute
        iTo = this.inferences.length;
        for (let i=0; i<iTo; i++) {
            this.inferences[i].row = <CrossStreamInferenceRow
                key={i}
                ref={
                    (input) => {
                        this.rowReferences["row_" + i] = input;
                    }
                }
                index={i}
                maxIndex={(iTo - 1)}
                order={(i + 1)}
                title={this.inferences[i].title}
                description={this.inferences[i].description}
                idPrefix={this.props.config.rowIdPrefix}
                fieldPrefix={this.props.config.fieldPrefix}
                buttonSetPrefix={this.props.config.buttonSetPrefix}
                buttonSetRegEx={this.props.config.buttonSetRegEx}
                handleButtonClick={this.handleButtonClick}
            />;
        }

        // Set the initial row objects based on the incoming inference objects
        this.state = {
            rows: this.inferences.map(inference => inference.row),
        };
    }

    // This method generates the HTML that replaces this object's JSX representation
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

        return (
            <div>
                <strong className="control-label">Inferences Across Streams</strong>
                <button id={this.props.config.addButtonId} className="btn btn-primary pull-right" type="button" onClick={this.handleButtonClick}>New Inference</button>
                <br className="inferencesClearBoth" />
                <table id={this.props.config.tableid} className="inferencesTable">
                    <thead>
                        <tr>
                            <th className="inferencesHeaderCell" style={columnStyles[0]}>Title</th>
                            <th className="inferencesHeaderCell" style={columnStyles[1]}>Description</th>
                            <th className="inferencesHeaderCell" style={columnStyles[2]}></th>
                        </tr>
                    </thead>
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

            if (event.target.id === this.props.config.addButtonId) {
                // The element clicked upon is the "Add A New Inference" button, add a new inference to this.inferences

                // Get values that will be used within props for the new inference row
                let newRowIndex = this.findMaximumIndex() + 1;
                let inferenceIndex = this.inferences.length;

                // Push a new, empty inference into this.inferences
                this.inferences.push(
                    {
                        title: "",
                        description: "",
                        row: null
                    }
                );

                // Create the new CrossStreamInferenceRow component object
                this.inferences[inferenceIndex].row = <CrossStreamInferenceRow
                    key={newRowIndex}
                    ref={
                        (input) => {
                            this.rowReferences["row_" + newRowIndex] = input;
                        }
                    }
                    index={newRowIndex}
                    maxIndex={newRowIndex}
                    order={(newRowIndex + 1)}
                    title={this.inferences[inferenceIndex].title}
                    description={this.inferences[inferenceIndex].description}
                    idPrefix={this.props.config.rowIdPrefix}
                    fieldPrefix={this.props.config.fieldPrefix}
                    buttonSetPrefix={this.props.config.buttonSetPrefix}
                    buttonSetRegEx={this.props.config.buttonSetRegEx}
                    handleButtonClick={this.handleButtonClick}
                />;

                // Set this.state.rows to the new inference rows array (inclding the new inference added to the end)
                this.setState(
                    {
                        rows: this.inferences.map(inference => inference.row),
                    }
                );
            }
            else if (event.target.id.match(this.props.config.buttonSetRegEx)) {
                // The element clicked upon is either a "Move Up," "Move Down" or "Remove" button from a row within the formset, attempt
                // to handle it

                let countInferences = this.inferences.length;
                let buttonDetails = event.target.id.replace(this.props.config.buttonSetRegEx, "$1,$2").split(",");
                if ((buttonDetails.length == 2) && (buttonDetails[0] !== "") && (buttonDetails[1] !== "")) {
                    // Two non-empty details were extracted from the clicked-up element's ID, continue

                    buttonDetails[0] = parseInt(buttonDetails[0]);
                    if (buttonDetails[0] >= 1) {
                        // The extracted row number from the element's ID is a potentially valid value, continue

                        let inferenceIndex = this.findInferenceIndex(buttonDetails[0]);
                        if (inferenceIndex > -1) {
                            // The row was found within this.inferences, keep working with it

                            if ((buttonDetails[1] === "moveup") && (inferenceIndex > 0)) {
                                // The clicked-upon element is a "Move Up" button in a row that is not at the top of the array, move it

                                // Swap the formset row's position with the one above it
                                let temp = this.inferences[inferenceIndex - 1];
                                this.inferences[inferenceIndex - 1] = this.inferences[inferenceIndex];
                                this.inferences[inferenceIndex] = temp;

                                // Update the state of this component (displays the re-ordered rows in the formset)
                                this.setState(
                                    {
                                        rows: this.inferences.map(inference => inference.row),
                                    }
                                );

                                // Get the references for each of the rows that were moved
                                let row_1 = this.rowReferences["row_" + this.inferences[inferenceIndex - 1].row.props.index];
                                let row_2 = this.rowReferences["row_" + this.inferences[inferenceIndex].row.props.index];

                                // Get the order values from the rows that were moved
                                let order_1 = row_1.orderReference.state.value;
                                let order_2 = row_2.orderReference.state.value;

                                // Set row 1's order value to the original order value from row 2
                                row_1.orderReference.setState(
                                    {
                                        value: order_2,
                                    }
                                );

                                // Set row 2's order value to the original order value from row 1
                                row_2.orderReference.setState(
                                    {
                                        value: order_1,
                                    }
                                );
                            }
                            else if ((buttonDetails[1] === "movedown") && (inferenceIndex < (countInferences - 1))) {
                                // The clicked-upon element is a "Move Down" button in a row that is not at the bottom of the array, move it

                                // Swap the formset row's position with the one below it
                                let temp = this.inferences[inferenceIndex];
                                this.inferences[inferenceIndex] = this.inferences[inferenceIndex + 1];
                                this.inferences[inferenceIndex + 1] = temp;

                                // Update the state of this component (displays the re-ordered rows in the formset)
                                this.setState(
                                    {
                                        rows: this.inferences.map(inference => inference.row),
                                    }
                                );

                                // Get the references for each of the rows that were moved
                                let row_1 = this.rowReferences["row_" + this.inferences[inferenceIndex].row.props.index];
                                let row_2 = this.rowReferences["row_" + this.inferences[inferenceIndex + 1].row.props.index];

                                // Get the order values from the rows that were moved
                                let order_1 = row_1.orderReference.state.value;
                                let order_2 = row_2.orderReference.state.value;

                                // Set row 1's order value to the original order value from row 2
                                row_1.orderReference.setState(
                                    {
                                        value: order_2,
                                    }
                                );

                                // Set row 2's order value to the original order value from row 1
                                row_2.orderReference.setState(
                                    {
                                        value: order_1,
                                    }
                                );
                            }
                            else if (buttonDetails[1] === "remove") {
                                // Set this.state.rows to the new inference rows array without the removed inference

                                this.inferences.splice(inferenceIndex, 1);
                                this.setState(
                                    {
                                        rows: this.inferences.map(inference => inference.row),
                                    }
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    // This method attemts to find the array index of the element in this.inferences that contains the CrossStreamInferenceRow element
    // whose index is the passed-in argument value
    // The this.inferences array indices and the CrossStreamInferenceRow elements' index values are initially the same; but as rows get
    // moved up and down, that changes -- making this method necessary
    findInferenceIndex(index) {
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
                let iTo = this.inferences.length;

                // Iterate through this.inferences until we either reach the end or find the element that contains the formset row being sought
                while ((returnValue === -1) && (i < iTo)) {
                    if (this.inferences[i].row.props.index === index) {
                        // The desired formset row was found, save i as returnValue
                        returnValue = i;
                    }

                    i++;
                }
            }
        }

        return returnValue;
    }

    // This method returns the value of the maximum index in the Cross-Stream Inference rows
    findMaximumIndex() {
        return Math.max(...this.inferences.map(inference => inference.row.props.index));
    }

    // After this Component has been updated (i.e. a row added, removed or moved up/down), this method runs to re-color the rows set
    // and button visibility
    componentDidUpdate() {
        let iTo = this.inferences.length;
        let iMax = iTo - 1;
        for (let i=0; i<iTo; i++) {
            let reference = this.rowReferences["row_" + this.inferences[i].row.props.index];

            // Alternate the row color on inference rows
            reference.rowReference.style.backgroundColor = ((i % 2) === 1) ? "#EEEEEE" : "#FFFFFF";

            // Only make the "Move Up" button visible whenever it is not in the first row
            reference.moveUpReference.style.visibility = (i === 0) ? "hidden" : "visible";

            // Only make the "Move Down" button visible whenever it is not in the last row
            reference.moveDownReference.style.visibility = (i === iMax) ? "hidden" : "visible";
        }
    }
}


// This Component class is used to manage a single Cross-Stream Inference's row in the formset
class CrossStreamInferenceRow extends Component {
    constructor(props) {
        // First, call the super-class's constructor
        super(props);
    }

    // This method generates the HTML for the table row that replaces this object's JSX representation
    render() {
        let plusOne = this.props.index + 1;
        let fieldPrefix = this.props.fieldPrefix + "_" + plusOne;
        let buttonSetPrefix = this.props.buttonSetPrefix + "_" + plusOne;

        return(
            <tr
                ref={
                    (input) => {
                        this.rowReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + plusOne}
                style={
                    {
                        backgroundColor: ((this.props.index % 2) === 1) ? "#EEEEEE" : "#FFFFFF",
                    }
                }
            >
                <td className="inferencesBodyCell">
                    <InputOrder
                        ref={
                            (input) => {
                                this.orderReference = input;
                            }
                        }
                        prefix={fieldPrefix}
                        value={this.props.order}
                    />
                    <InputTitle
                        ref={
                            (input) => {
                                this.titleReference = input;
                            }
                        }
                        prefix={fieldPrefix}
                        value={this.props.title}
                    />
                </td>
                <td className="inferencesBodyCell">
                    <TextAreaDescription
                        ref={
                            (input) => {
                                this.descriptionReference = input;
                            }
                        }
                        prefix={fieldPrefix}
                        value={this.props.description}
                    />
                </td>
                <td className="inferencesBodyCell">
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
                        <i id={buttonSetPrefix + "_moveup"} className="icon-arrow-up" />
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
                        <i id={buttonSetPrefix + "_movedown"} className="icon-arrow-down" />
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
                        <i id={buttonSetPrefix + "_remove"} className="icon-remove" />
                    </button>
                    <br />
                </td>
            </tr>
        );
    }
}


// This Component class is used to create an input field for a single Cross-Stream Inference's order within the set of inferences
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
                id={this.props.prefix + "_order"}
                type="hidden"
                name={this.props.prefix + "_order"}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            />
        );
    }
}


// This Component class is used to create an input field for a single Cross-Stream Inference's title
class InputTitle extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        this.state = {
            value: props.value
        };
    }

    // Update the tag's state with the new value of the contained input
    updateField(event) {
        this.setState(
            {
                value: event.target.value
            }
        );
    }

    // Place the desired input field on the page
    render() {
        return (
            <input
                id={this.props.prefix + "_title"}
                className="span12 textinput textInput"
                type="text"
                maxLength="50"
                required="required"
                name={this.props.prefix + "_title"}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            />
        );
    }
}


// This Component class is used to create a textarea field for a single Cross-Stream Inference's description
class TextAreaDescription extends Component {
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
                id={this.props.prefix + "_description"}
                className="span12"
                cols="40"
                rows="4"
                required="required"
                name={this.props.prefix + "_description"}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            >
            </textarea>
        );
    }
}


// This exported function attempts to build a Cross-Stream Inferences formset in the locations specified by the incoming arguments
export function renderCrossStreamInferencesFormset(inferences, formConfig, inferencesConfig) {
    let formActionsList = document.querySelectorAll("#" + formConfig.id + " ." + formConfig.actionsClass);
    if (formActionsList.length > 0) {
        // The desired element was found in the page, attempt to add the new element as desired

        formActionsList[0].insertAdjacentHTML("beforebegin", '<hr style="margin-top:-12px; border-width:1px;" /><div id="' + inferencesConfig.divId + '" style="font-size:0.9em; margin:0 0 32px 0; padding:0"></div>');
        ReactDOM.render(
            <CrossStreamInferencesFormset inferences={inferences} config={inferencesConfig} />,
            document.getElementById(inferencesConfig.divId)
        );
    }
}

export default CrossStreamInferencesFormset;
