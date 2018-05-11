import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import "./index.css";

// This class is used to manage the Cross-Stream Inferences formset portion of the Evidence Profile form
class CrossStreamInferencesFormset extends Component {
    inferences = [];

    constructor(props) {
        // Frist, call the super-class's constructor
        super(props);
        this.handleButtonClick = this.handleButtonClick.bind(this);
        this.updateInference = this.updateInference.bind(this);

        this.inferences = (typeof(props.inferences) == "object") ? props.inferences : [];
        this.inferences.push(
            {
                title: "",
                description: "",
            }
        );

        // Set the initial state based on the incoming props
        this.state = {
            rows: this.buildInferenceRows(),
        };
    }

    buildInferenceRows() {
        let returnValue = [];

        let countInferences = this.inferences.length;
        for (let i=0; i<countInferences; i++) {
            returnValue.push(
                <CrossStreamInferenceRow
                    key={i}
                    order={(i + 1)}
                    maxOrder={countInferences}
                    title={this.inferences[i].title}
                    description={this.inferences[i].description}
                    idPrefix={this.props.config.rowIdPrefix}
                    fieldPrefix={this.props.config.fieldPrefix}
                    buttonSetPrefix={this.props.config.buttonSetPrefix}
                    buttonSetRegEx={this.props.config.buttonSetRegEx}
                    handleButtonClick={this.handleButtonClick}
                    updateInference={this.updateInference}
                />
            );
        }

        return returnValue;
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
                <br className="clearBoth" />
                <table id={this.props.config.tableid} className="inferencesTable">
                    <thead>
                        <tr>
                            <th className="inferencesHeaderCell" style={columnStyles[0]}>Title</th>
                            <th className="inferencesHeaderCell" style={columnStyles[1]}>Explanation</th>
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
                // The element clicked upon is the "Add A New Visualization" button, add a new inference to this.state.inferences

                this.inferences.push(
                    {
                        title: "",
                        description: "",
                    }
                );

                // Set this.state.rows to the new inference rows array (inclding the new inference added to the end)
                this.setState(
                    {
                        rows: this.buildInferenceRows(),
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

                    buttonDetails[1] = parseInt(buttonDetails[1]);
                    if ((buttonDetails[1] >= 1) && (buttonDetails[1] <= countInferences)) {
                        // The extracted row number from the element's ID is a valid value, continue

                        if ((buttonDetails[0] === "moveup") && (buttonDetails[1] > 1)) {
                            // The clicked-upon element is a "Move Up" button in a row that is not at the top of the array, move it

                            let temp = this.inferences[buttonDetails[1] - 1];
                            this.inferences[buttonDetails[1] - 1] = this.inferences[buttonDetails[1] - 2];
                            this.inferences[buttonDetails[1] - 2] = temp;

                            // Set this.state.rows to the newly re-ordered inference rows array
                            this.setState(
                                {
                                    rows: this.buildInferenceRows(),
                                }
                            );
                        }
                        else if ((buttonDetails[0] === "movedown") && (buttonDetails[1] < countInferences)) {
                            // The clicked-upon element is a "Move Down" button in a row that is not at the bottom of the array, move it

                            let temp = this.inferences[buttonDetails[1]];
                            this.inferences[buttonDetails[1]] = this.inferences[buttonDetails[1] - 1];
                            this.inferences[buttonDetails[1] - 1] = temp;

                            // Set this.state.rows to the newly re-ordered inference rows array
                            this.setState(
                                {
                                    rows: this.buildInferenceRows(),
                                }
                            );
                        }
                        else if (buttonDetails[0] === "remove") {
                            // The clicked-upon element is a "Remove" button in a row, remove it
                            this.inferences.splice(buttonDetails[1] - 1, 1);

                            // Set this.state.rows to the new inference rows array without the removed inference
                            this.setState(
                                {
                                    rows: this.buildInferenceRows(),
                                }
                            );
                        }
                    }
                }
            }
        }
    }

    // This function updates an inference in this.inferences
    updateInference(index, title, description) {
        index = parseInt(index);
        if ((!isNaN(index)) && (index >= 1) && (index <= this.inferences.length) && (typeof(title) === "string") && (typeof(description) === "string")) {
            // All of the incoming arguments are valid, set the desired inference accordingly

            this.inferences[index - 1] = {
                title: title,
                description: description,
            };
        }
    }
}

// This class is used to manage a Cross-Stream Inference's row in the formset
class CrossStreamInferenceRow extends Component {
    constructor(props) {
        // Frist, call the super-class's constructor
        super(props);
        this.updateField = this.updateField.bind(this);

        // Set the initial state based on the incoming props
        this.state = {
            order: props.order,
            title: props.title,
            description: props.description,
        };
    }

    // This method generates the HTML that replaces this object's JSX representation
    render() {
        let rowStyle = {
            backgroundColor: ((this.state.order % 2) == 1) ? "#FFFFFF" : "#EEEEEE",
        };

        return(
            <tr id={this.props.idPrefix + "_" + this.state.order} style={rowStyle}>
                <td className="inferencesBodyCell">
                    <input
                        id={this.props.fieldPrefix + "_title_" + this.state.order}
                        className="span12 textinput textInput"
                        type="text"
                        maxLength="50"
                        required="required"
                        name={this.props.fieldPrefix + "_title_" + this.state.order}
                        value={this.state.title}
                        onChange={(e) => this.updateField(e, "title")}
                    />
                </td>
                <td className="inferencesBodyCell">
                    <textarea
                        id={this.props.fieldPrefix + "_description_" + this.state.order}
                        className="span12"
                        cols="40"
                        rows="4"
                        required="required"
                        name={this.props.fieldPrefix + "_description_" + this.state.order}
                        value={this.state.description}
                        onChange={(e) => this.updateField(e, "description")}
                    >
                    </textarea>
                </td>
                <td className="inferencesBodyCell">
                    {
                        (this.state.order != 1) ?
                            <button className="btn btn-mini" title="move up" type="button" onClick={(e) => this.props.handleButtonClick(e)}>
                                <i id={this.props.buttonSetPrefix + "_moveup_" + this.state.order} className="icon-arrow-up" />
                            </button>
                        :
                            ""
                    }
                    <br />

                    {
                        (this.state.order != this.props.maxOrder) ?
                            <button className="btn btn-mini" title="move down" type="button" onClick={(e) => this.props.handleButtonClick(e)}>
                                <i id={this.props.buttonSetPrefix + "_movedown_" + this.state.order} className="icon-arrow-down" />
                            </button>
                        :
                            ""
                    }
                    <br />

                    <button className="btn btn-mini" title="remove" type="button" onClick={(e) => this.props.handleButtonClick(e)}>
                        <i id={this.props.buttonSetPrefix + "_remove_" + this.state.order} className="icon-remove" />
                    </button>
                    <br />
                </td>
            </tr>
        );
    }

    componentWillReceiveProps(nextProps) {
        this.setState(
            {
                order: nextProps.order,
                title: nextProps.title,
                description: nextProps.description,
            }
        );
    }

    updateField(event, fieldName) {
        if (
            (typeof(event) == "object")
            && (typeof(event.target) == "object")
            && (typeof(event.target.value) != "undefined")
            && (typeof(fieldName) == "string")
            && (fieldName != "")
            && (typeof(this.state[fieldName]) != "undefined")
        ) {
            // The fieldName argument is a non-empty string that corresponds to an attribute of this.state, and the updated
            // element has a value field; update this object's state and the parent's inferences accordingly

            let newState = {};
            newState[fieldName] = event.target.value;
            this.setState(
                newState,
                () => this.props.updateInference(this.state.order, this.state.title, this.state.description)
            );
        }
    }
}

// This exported function attempts to build a Cross-Stream Inferences formset in the locations specified by the incoming arguments
export function renderCrossStreamInferencesFormset(inferences, formConfig, inferencesConfig) {
    let formActionsList = document.querySelectorAll("#" + formConfig.id + " ." + formConfig.actionsClass);
    if (formActionsList.length > 0) {
        // The desired element was found in the page, attempt to add the new element as desired

        formActionsList[0].insertAdjacentHTML("beforebegin", '<hr /><div id="' + inferencesConfig.divId + '" style="font-size:0.9em; margin:0 0 32px 0; padding:0"></div>');
        ReactDOM.render(
            <CrossStreamInferencesFormset inferences={inferences} config={inferencesConfig} />,
            document.getElementById(inferencesConfig.divId)
        );
    }
}

export default CrossStreamInferencesFormset;
