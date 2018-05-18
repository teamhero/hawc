import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import "./index.css";

// This class is used to manage the Cross-Stream Inferences formset portion of the Evidence Profile form
class CrossStreamInferencesFormset extends Component {
    inferences = [];

    constructor(props) {
        // First, call the super-class's constructor
        super(props);

        // Bind the desired class functions to this object
        this.handleButtonClick = this.handleButtonClick.bind(this);

        // Get the incoming inferences from the props and save them as an object-level attribute (defaulting to an empty
        // array if no inferences were passed in)
        this.inferences = (typeof(props.inferences) === "object") ? props.inferences : [];
        let iTo = this.inferences.length;
        for (let i=0; i<iTo; i++) {
            this.inferences[i]["reference"] = null;
            this.inferences[i]["row"] = null;
        }

        // Push an empty inference onto the end of the array
        this.inferences.push(
            {
                title: "A",
                description: "AA",
                reference: null,
                row: null,
            }
        );

        // Push an empty inference onto the end of the array
        this.inferences.push(
            {
                title: "B",
                description: "BB",
                reference: null,
                row: null,
            }
        );

        // Push an empty inference onto the end of the array
        this.inferences.push(
            {
                title: "",
                description: "",
                reference: null,
                row: null,
            }
        );

        iTo = this.inferences.length;
        for (let i=0; i<iTo; i++) {
            this.inferences[i].row = <CrossStreamInferenceRow
                key={i}
                ref={
                    (input) => {
                        this.inferences[i].reference = input;
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

    /*
    buildInferenceRows() {
        let returnValue = [];

        let iTo = this.inferences.length;
        console.log("In buildInferenceRows()");
        console.log("iTo = " + iTo);
        for (let i=0; i<iTo; i++) {
            console.log("i = " + i);
            console.log("index = " + i);
            console.log("maxIndex = " + (iTo - 1));
            console.log("order = " + (i + 1));
            returnValue.push(
                <CrossStreamInferenceRow
                    key={i}
                    ref={
                        (input) => {
                            this.inferences[i].reference = input;
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
                />
            );
        }

        console.log("----------------------------------------");
        return returnValue;
    }
    */

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
                // The element clicked upon is the "Add A New Visualization" button, add a new inference to this.inferences and this.state.rows
                /*
                console.log("In handleButtonClick() [Add Inference portion]");
                */

                let newRowIndex = this.findMaximumIndex() + 1;
                let inferenceIndex = this.inferences.length;

                this.inferences.push(
                    {
                        title: "",
                        description: "",
                        reference: null,
                        row: null
                    }
                );

                /*
                let newRows = Object.assign([], this.state.rows);
                console.log("findMaximumIndex() = " + this.findMaximumIndex());
                */
                console.log("newRowIndex = " + newRowIndex);
                console.log("inferences.length = " + this.inferences.length);
                console.log("inferenceIndex = " + inferenceIndex);
                /*
                console.log("state.rows.length = " + this.state.rows.length);
                console.log("typeof(this.inferences[" + inferenceIndex + "]) = " + typeof(this.inferences[inferenceIndex]));
                */

                /*
                this.inferences[inferenceIndex].row = <CrossStreamInferenceRow
                    key={newRowIndex}
                    ref={
                        (input) => {
                            this.inferences[inferenceIndex].reference = input;
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
                        rows: newRows,
                    }
                );
                */

                /*
                console.log("----------------------------------------");
                */
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

                        let rowIndex = this.findRowIndex(buttonDetails[0]);
                        if (rowIndex > -1) {
                            // The row was found within this.state.rows, keep working with it

                            if ((buttonDetails[1] === "moveup") && (rowIndex > 0)) {
                                // The clicked-upon element is a "Move Up" button in a row that is not at the top of the array, move it

                                console.log("In handleButtonClick() [Move Inference Up portion]");
                                /*
                                console.log("countInferences = " + countInferences);
                                console.log("buttonDetails = " + buttonDetails);
                                console.log("rowIndex = " + rowIndex);
                                console.log("typeof(this.inferences[" +  rowIndex + "]) = " + typeof(this.inferences[rowIndex]));
                                if (typeof(this.inferences[rowIndex]) != "undefined") {
                                    console.log("(this.inferences[rowIndex].reference === null) = " + (this.inferences[rowIndex].reference === null));
                                }
                                */

                                let newRows = Object.assign([], this.state.rows);
                                temp = newRows[rowIndex];
                                newRows[rowIndex] = newRows[rowIndex - 1];
                                newRows[rowIndex - 1] = temp;

                                // Set this.state.rows to the newly re-ordered inference rows array
                                this.setState(
                                    {
                                        rows: newRows,
                                    }
                                );

                                let temp = this.inferences[rowIndex];
                                this.inferences[rowIndex] = this.inferences[rowIndex - 1];
                                this.inferences[rowIndex - 1] = temp;
                                /*
                                console.log("this.inferences[" + (rowIndex - 1) + "]");
                                console.log(this.inferences[rowIndex - 1]);
                                console.log("this.inferences[" + rowIndex + "]");
                                console.log(this.inferences[rowIndex])
                                */

                                let row_1 = this.inferences[rowIndex - 1].reference;
                                let row_2 = this.inferences[rowIndex].reference;

                                console.log("row_1:");
                                console.log(row_1);
                                console.log(typeof(row_1.orderReference));
                                console.log("row_2:");
                                console.log(row_2);
                                console.log(typeof(row_2.orderReference));

                                let order_1 = row_1.orderReference.state.value;
                                let order_2 = row_2.orderReference.state.value;

                                row_1.orderReference.setState(
                                    {
                                        value: order_2,
                                    }
                                );

                                row_2.orderReference.setState(
                                    {
                                        value: order_1,
                                    }
                                );

                                console.log("----------------------------------------");
                            }
                            else if ((buttonDetails[1] === "movedown") && (rowIndex < (countInferences - 1))) {
                                // The clicked-upon element is a "Move Down" button in a row that is not at the bottom of the array, move it

                                console.log("In handleButtonClick() [Move Inference Down portion]");
                                /*
                                console.log("countInferences = " + countInferences);
                                console.log("buttonDetails = " + buttonDetails);
                                console.log("rowIndex = " + rowIndex);
                                console.log("typeof(this.inferences[" +  rowIndex + "]) = " + typeof(this.inferences[rowIndex]));
                                if (typeof(this.inferences[rowIndex]) != "undefined") {
                                    console.log("(this.inferences[rowIndex].reference === null) = " + (this.inferences[rowIndex].reference === null));
                                }
                                */

                                let newRows = Object.assign([], this.state.rows);
                                temp = newRows[rowIndex];
                                newRows[rowIndex] = newRows[rowIndex + 1];
                                newRows[rowIndex + 1] = temp;

                                // Set this.state.rows to the newly re-ordered inference rows array
                                this.setState(
                                    {
                                        rows: newRows,
                                    }
                                );

                                let temp = this.inferences[rowIndex];
                                this.inferences[rowIndex] = this.inferences[rowIndex + 1];
                                this.inferences[rowIndex + 1] = temp;
                                /*
                                console.log("this.inferences[" + rowIndex + "]");
                                console.log(this.inferences[rowIndex]);
                                console.log("this.inferences[" + (rowIndex + 1) + "]");
                                console.log(this.inferences[rowIndex + 1]);
                                */

                                let row_1 = this.inferences[rowIndex].reference;
                                let row_2 = this.inferences[rowIndex + 1].reference;
                                console.log("row_1:");
                                console.log(row_1);
                                console.log(typeof(row_1));
                                console.log("row_2:");
                                console.log(row_2);
                                console.log(typeof(row_2));

                                let order_1 = row_1.orderReference.state.value;
                                let order_2 = row_2.orderReference.state.value;

                                row_1.orderReference.setState(
                                    {
                                        value: order_2,
                                    }
                                );

                                row_2.orderReference.setState(
                                    {
                                        value: order_1,
                                    }
                                );

                                console.log("----------------------------------------");
                            }
                            else if (buttonDetails[1] === "remove") {
                                // Set this.state.rows to the new inference rows array without the removed inference

                                console.log("In handleButtonClick() [Remove Inference portion]");
                                /*
                                console.log("countInferences = " + countInferences);
                                console.log("buttonDetails = " + buttonDetails);
                                console.log("rowIndex = " + rowIndex);
                                console.log("typeof(this.inferences[" +  rowIndex + "]) = " + typeof(this.inferences[rowIndex]));
                                if (typeof(this.inferences[rowIndex]) != "undefined") {
                                    console.log("(this.inferences[rowIndex].reference === null) = " + (this.inferences[rowIndex].reference === null));
                                }
                                */

                                /*
                                let newRows = Object.assign([], this.state.rows);
                                newRows.splice(rowIndex, 1);
                                for (let i=0; i<this.state.rows.length; i++) {
                                    console.log(i + "/ " + buttonDetails + " / " + typeof(buttonDetails[0]) + " / " + parseInt(this.state.rows[i].key) + " / " + typeof(this.state.rows[i].key) + " / " + (parseInt(this.state.rows[i].key) !== (buttonDetails[0] - 1)));
                                }
                                let newRows = this.state.rows.filter(row => (parseInt(row.key) !== (buttonDetails[0] - 1)));
                                console.log(newRows);
                                */

                                /*
                                this.setState(
                                    {
                                        rows: newRows,
                                    }
                                );
                                */

                                this.setState(
                                    prevState => (
                                        {
                                            rows: prevState.rows.filter(row => (parseInt(row.key) !== (buttonDetails[0] - 1)))
                                        }
                                    )
                                );

                                console.log("----------------------------------------");
                            }
                        }
                    }
                }
            }
        }
    }

    findRowIndex(index) {
        let returnValue = -1;

        /*
        if (typeof(index) == "number") {
            index = Math.floor(index);
            if (index > 0) {
                index = index - 1;

                let counter = 0;
                let maxCount = this.state.rows.length;
                while ((counter < maxCount) && (index !== parseInt(this.state.rows[counter].key))) {
                    counter++;
                }

                returnValue = counter;
            }
        }
        */

        return returnValue;
    }

    findMaximumIndex() {
        let returnValue = 0;

        console.log(Math.max(this.inferences.map(inference => parseInt(inference.row.key))));

        /*
        let counter = 0;
        let maxCount = this.state.rows.length;
        while (counter < maxCount) {
            returnValue = Math.max(returnValue, this.state.rows[counter].key);
            counter++;
        }
        */

        return returnValue;
    }

    componentDidUpdate() {
        /*
        console.log("In componentDidUpdate()");

        this.inferences = this.inferences.filter(inference => (inference.reference !== null));
        console.log("this.inferences");
        console.log(this.inferences);
        */

        /*
        let indexToRemove = -1;
        let i = 0;
        let iTo = this.inferences.length;
        while ((i < iTo) && (indexToRemove === -1)) {
            console.log("i = " + i);
            console.log("this.inferences[" + i + "].reference = " + this.inferences[i].reference);
            if (this.inferences[i].reference === null) {
                indexToRemove = i;
            }

            i++;
        }

        console.log("indexToRemove = " + indexToRemove);
        */

        /*
        let iTo = this.inferences.length;
        let counter = -1;
        let maxCounter = iTo - 1;
        for (let i=0; i<iTo; i++) {
            console.log(i);
            console.log(this.inferences[i].reference);
            console.log(this.inferences[i].reference.rowReference);
            if ((this.inferences[i].reference !== null) && (this.inferences[i].reference.rowReference !== null)) {
                counter++;
                this.inferences[i].reference.rowReference.style.backgroundColor = ((counter % 2) === 1) ? "#EEEEEE" : "#FFFFFF";
                this.inferences[i].reference.moveUpReference.style.visibility = (counter === 0) ? "hidden" : "visible";
                this.inferences[i].reference.moveDownReference.style.visibility = (counter === maxCounter) ? "hidden" : "visible";
            }
        }

        if (indexToRemove > -1) {
            this.inferences.splice(indexToRemove, 1);
        }
        */

        /*
        console.log("----------------------------------------");
        */
    }
}

// This class is used to manage a Cross-Stream Inference's row in the formset
class CrossStreamInferenceRow extends Component {
    constructor(props) {
        // Frist, call the super-class's constructor
        super(props);
    }

    // This method generates the HTML that replaces this object's JSX representation
    render() {
        let fieldPrefix = this.props.fieldPrefix + "_" + (this.props.index + 1);
        let buttonSetPrefix = this.props.buttonSetPrefix + "_" + (this.props.index + 1);

        return(
            <tr
                ref={
                    (input) => {
                        this.rowReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + (this.props.index + 1)}
                style={
                    {
                        backgroundColor: (true === false) ? "#EEEEEE" : "#FFFFFF",
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
                                visibility: ((true == true) ? "visible" : "hidden")
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
                                visibility: ((true === true) ? "visible" : "hidden")
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

class InputOrder extends Component {
    constructor(props) {
        super(props);
        this.updateField = this.updateField.bind(this);

        this.state = {
            value: props.value
        };
    }

    updateField(event) {
    }

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

class InputTitle extends Component {
    constructor(props) {
        super(props);
        this.updateField = this.updateField.bind(this);

        this.state = {
            value: props.value
        };
    }

    updateField(event) {
        this.setState(
            {
                value: event.target.value
            }
        );
    }

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

class TextAreaDescription extends Component {
    constructor(props) {
        super(props);
        this.updateField = this.updateField.bind(this);

        this.state = {
            value: props.value
        };
    }

    updateField(event) {
        this.setState(
            {
                value: event.target.value
            }
        );
    }

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
