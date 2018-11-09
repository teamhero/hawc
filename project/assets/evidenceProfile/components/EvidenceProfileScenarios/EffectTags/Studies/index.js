import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import AutoSuggest from 'react-autosuggest';

import "./index.css";

import fetch from 'isomorphic-fetch';
import h from 'shared/utils/helpers';

// Set the colors to be used as shades for the alternating Effect Tags within this Scenario
let shade1 = "#FFFFE9";
let shade2 = "#FFFFCF";

// This Component object is the container for this entire Effect Tags formset
class StudiesFormset extends Component {
    studies = [];
    studyReferences = {};

    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        // Create a set of variables that need to be initialized within this constructor, along with the incoming regular expressions that will be used 
        // to initialize them
        let variablesToCreate = {
            addButtonId: props.config.addButtonIdPattern,
            tableId: props.config.tableIdPattern,
            studyIdPrefix: props.config.studyIdPrefixPattern,
            fieldPrefix: props.config.fieldPrefixPattern,
            buttonSetPrefix: props.config.buttonSetPrefixPattern,
        };

        for (let i in variablesToCreate) {
            this[i] = variablesToCreate[i].replace(/<<streamIndex>>/, this.props.streamIndex).replace(/<<scenarioIndex>>/, this.props.scenarioIndex).replace(/<<effectTagIndex>>/, this.props.effectTagIndex);
        }

        // Bind the desired class functions to this object
        this.handleButtonClick = this.handleButtonClick.bind(this);

        // First, look for a "studies" object in the incoming props -- defaulting to an empty array if none is found
        let iterateOverStudies = (("studies" in props) && (typeof(props.studies) === "object") && (props.studies !== null) && (Array.isArray(props.studies))) ? props.studies : [];

        // Iterate over the incoming studies and use them to build the object level "effectTags" and "effectTagReferences" attributes
        let iTo = iterateOverStudies.length;
        for (let i=0; i<iTo; i++) {
            this.studies.push(
                {
                    id: iterateOverStudies[i],
                    title: (iterateOverStudies[i] in this.props.studyTitles) ? this.props.studyTitles[iterateOverStudies[i]] : "",
                    tr: null,
                }
            );
        }

        if (this.props.profileId <= 0) {
            // This formset is part of a new Evidence Profile, push an empty Study onto the end of this.studies and increment iTo

            this.studies.push(
                {
                    id: null,
                    title: null,
                    tr: null,
                }
            );

            iTo++;
        }

        // Iterate through this.studies to create the caption and detail <div>s
        for (let i=0; i<iTo; i++) {
            // Create a new StudyDiv for this study and place it into the study's "div" attribute
            this.studies[i].tr = <StudyRow
                key={i}
                ref={
                    (input) => {
                        this.studyReferences["tr_" + i] = input;
                    }
                }
                index={i}
                maxIndex={(iTo - 1)}
                order={(i + 1)}
                pk={this.studies[i].id}
                streamIndex={this.props.streamIndex}
                scenarioIndex={this.props.scenarioIndex}
                effectTagIndex={this.props.effectTagIndex}
                title={this.studies[i].title}
                config={this.props.config}
                idPrefix={this.studyIdPrefix}
                fieldPrefix={this.fieldPrefix}
                buttonSetPrefix={this.buttonSetPrefix}
                handleButtonClick={this.handleButtonClick}
                handleStudySelection={this.handleStudySelection}
                studySearchURL={this.props.config.studySearchURL}
                studyReferences={this.studyReferences}
            />;
        }

        this.state = {
            rows: this.studies.map(study => study.tr),
        };
    }

    // This method generates the HTML that replaces this object's JSX representation
    render() {
        return(
            <div>
                <strong className="control-label studiesSectionTitle">Studies Within This Tag</strong>
                <button id={this.addButtonId} className="btn btn-primary pull-right" type="button" onClick={this.handleButtonClick}>New Study</button>
                <br className="studiesClearBoth" />
                <table id={this.targetId} className={"studiesTable"}>
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
                // The element clicked upon is the "Add A New Study" button, add a new study to this.studies and this.studyReferences

                // Get values that will be used within props for the new study <div>
                let newRowIndex = (this.studies.length > 0) ? (Math.max(...this.studies.map(study => study.tr.props.index)) + 1) : 0;
                let studyIndex = this.studies.length;

                // Push a new, empty study into this.studies
                this.studies.push(
                    {
                        id: null,
                        title: null,
                        tr: null,
                    }
                );

                // Create the new StudyDiv component object
                this.studies[studyIndex].tr = <StudyRow
                    key={newRowIndex}
                    ref={
                        (input) => {
                            this.studyReferences["tr_" + newRowIndex] = input;
                        }
                    }
                    index={newRowIndex}
                    maxIndex={newRowIndex}
                    order={(newRowIndex + 1)}
                    pk={this.studies[studyIndex].id}
                    streamIndex={this.props.streamIndex}
                    scenarioIndex={this.props.scenarioIndex}
                    effectTagIndex={this.props.effectTagIndex}
                    title={this.studies[studyIndex].title}
                    config={this.props.config}
                    idPrefix={this.studyIdPrefix}
                    fieldPrefix={this.fieldPrefix}
                    buttonSetPrefix={this.buttonSetPrefix}
                    handleButtonClick={this.handleButtonClick}
                    handleStudySelection={this.handleStudySelection}
                    studySearchURL={this.props.config.studySearchURL}
                    studyReferences={this.studyReferences}
                />;

                // Set this.state.rows to the new rows array (including the new study added to the end)
                this.setState(
                    {
                        rows: this.studies.map(study => study.tr),
                    }
                );
            }
            else {
                // The element clicked upon is either a "Move Up," "Move Down," "Remove," "Show" or "Hide" button from a <div> within the formset,
                // attempt to handle it

                let countStudies = this.studies.length;
                let buttonDetails = event.target.id.replace(this.props.config.buttonSetRegEx, "$1,$2,$3,$4,$5").split(",");

                if ((buttonDetails.length == 5) && (buttonDetails[0] !== "") && (buttonDetails[1] !== "") && (buttonDetails[2] !== "") && (buttonDetails[3] !== "")) {
                    // Four non-empty details were extracted from the clicked-upon element's ID, continue

                    buttonDetails[0] = parseInt(buttonDetails[0]);
                    buttonDetails[1] = parseInt(buttonDetails[1]);
                    buttonDetails[2] = parseInt(buttonDetails[2]);
                    buttonDetails[3] = parseInt(buttonDetails[3]);

                    if (
                        (buttonDetails[0] === this.props.streamIndex)
                        && (buttonDetails[1] === this.props.scenarioIndex)
                        && (buttonDetails[2] >= this.props.effectTagIndex)
                        && (buttonDetails[3] >= 1)
                    ) {
                        // The first button detail matches the streamIndex, the second button detail matches the scenarioIndex, the third button detail matches
                        // the effectTagIndex, and the fourth button detail is a potentially valid index for a study <tr>

                        let studyIndex = this.findStudyIndex(buttonDetails[3]);
                        if (studyIndex > -1) {
                            // The <tr> was found within this.effectTags, keep working with it

                            buttonDetails[4] = buttonDetails[4].toLowerCase();
                            if ((buttonDetails[4] === "moveup") && (studyIndex > 0)) {
                                // The user clicked on the "Move Up" button and the study is not at the top of the list, move it up in the list

                                let temp = this.studies[studyIndex];
                                this.studies[studyIndex] = this.studies[studyIndex - 1];
                                this.studies[studyIndex - 1] = temp;

                                this.setState(
                                    {
                                        rows: this.studies.map(study => study.tr),
                                    }
                                );
                            }
                            else if ((buttonDetails[4] === "movedown") && (studyIndex < (this.studies.length - 1))) {
                                // The user clicked on the "Move Down" button and the study is not at the bottom of the list, move it down
                                // in the list

                                let temp = this.studies[studyIndex];
                                this.studies[studyIndex] = this.studies[studyIndex + 1];
                                this.studies[studyIndex + 1] = temp;

                                this.setState(
                                    {
                                        rows: this.studies.map(study => study.tr),
                                    }
                                );
                            }
                            else if (buttonDetails[4] === "remove") {
                                // The user clicked on the "Remove" button, remove the <tr>

                                this.studies.splice(studyIndex, 1);
                                this.setState(
                                    {
                                        rows: this.studies.map(study => study.tr),
                                    }
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    // This method is called when a study is selected within this formset
    handleStudySelection(id, study) {
        let idMatcher = new RegExp("^(stream_\\d+_\\d_\\d_\\d_study)_suggest$", "gi");

        if ((typeof(id) === "string") && (id != "") && (id.match(idMatcher)) && (typeof(study) === "object") && (study !== null) && ("id" in study) && (study.id != "")) {
            // The id argument is a non-empty string that matches the expected naming convention, and the study argument is an object with a
            // non-empty id attribute; attempt to find a similarly-named DOM element that holds a Study's ID value

            let studyIdField = document.getElementById(id.replace(idMatcher, "$1_pk"));
            if (studyIdField !== null) {
                // The expected DOM element was found, set its value to the value of study.id
                studyIdField.value = study.id;

                let studyTitleField = document.getElementById(id.replace(idMatcher, "$1_title"));
                if (studyTitleField !== null) {
                    // The expected field that holds the title's text was found, place the selected suggestion's title and short citation in it
                    studyTitleField.innerHTML = study.value;
                }
            }
        }
    }

    // After this Component has been updated (i.e. a <div> added, removed or moved up/down), this method runs to re-color the <div>s and set
    // button visibility
    componentDidUpdate() {
        let iTo = this.studies.length;
        let iMax = iTo - 1;

        for (let i=0; i<iTo; i++) {
            let reference = this.studyReferences["tr_" + this.studies[i].tr.props.index];

            // Alternate the <tr> color on studies
            reference.studyReference.style.backgroundColor = ((i % 2) === 1) ? shade1 : shade2;

            // Only make the "Move Up" button visible whenever it is not in the first study
            reference.moveUpReference.style.visibility = (i === 0) ? "hidden" : "visible";

            // Only make the "Move Down" button visible whenever it is not in the last study
            reference.moveDownReference.style.visibility = (i === iMax) ? "hidden" : "visible";

            // Set the value of the ordering <input />'s value for this study's <div>
            reference.orderReference.setState(
                {
                    value: (i + 1),
                }
            );
        }
    }

    // This method attempts to find the array index of the element in this.studies that contains the <StudyRow> element
    // whose index is the passed-in argument value
    // The this.studies array indices and the StudyReference elements' index values are initially the same; but as rows get
    // moved up and down, that changes -- making this method necessary
    findStudyIndex(index) {
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
                let iTo = this.studies.length;

                // Iterate through this.effectTags until we either reach the end or find the element that contains the formset row being sought
                while ((returnValue === -1) && (i < iTo)) {
                    if (this.studies[i].tr.props.index === index) {
                        // The desired formset tr was found, save i as returnValue
                        returnValue = i;
                    }

                    i++;
                }
            }
        }

        return returnValue;
    }
}


// This object is a single Effect Tag Study form fragment
class StudyRow extends Component {
    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        this.pk = (("pk" in this.props) && (this.props.pk !== null) && (typeof(this.props.pk) === "number")) ? this.props.pk : "";
        this.title = (("title" in this.props) && (this.props.title !== null)) ? this.props.title : "";

        // These fields will get used multiple times each, so it is a good idea to go ahead and declare them
        this.plusOne = this.props.index + 1;
        this.fieldPrefix = this.props.fieldPrefix + "_" + this.plusOne + "_study";
        this.buttonSetPrefix = this.props.buttonSetPrefix + "_" + this.plusOne;
    }

    render() {
        return (
            <tr
                ref={
                    (input) => {
                        this.studyReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + this.plusOne}
                style={
                    {
                        backgroundColor: ((this.props.index % 2) === 1) ? shade1 : shade2,
                    }
                }
            >
                <td className={"studyCell_pk"}>
                    <InputOrder
                        ref={
                            (input) => {
                                this.orderReference = input;
                            }
                        }
                        id={this.fieldPrefix + "_order"}
                        value={this.props.order}
                    />

                    <input id={this.fieldPrefix + "_pk"} type="hidden" name={this.fieldPrefix + "_pk"} value={this.pk} />
                    <span id={this.fieldPrefix + "_title"}>{this.title}</span>

                    <label htmlFor={this.fieldPrefix + "_suggest"} className="control-label">{(this.pk !== "") ? "Change Study" : "Study"}</label>
                    <StudyAutoSuggest
                        id={this.fieldPrefix + "_suggest"}
                        placeholder={"Study..."}
                        url={this.props.studySearchURL}
                        handleStudySelection={this.props.handleStudySelection}
                        value={""}
                    />
                </td>
                <td className={"studyCell_rightButtons"}>
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


// This Component class is used to create an input field for a single study's order within the set of studies
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


// This Component class is used to create an auto-suggest field for looking up an Assessment Study
class StudyAutoSuggest extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its necessary methods
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
        this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
        this.getSuggestionValue = this.getSuggestionValue.bind(this);
        this.renderSuggestion = this.renderSuggestion.bind(this);

        this.state = {
                value: this.props.value,
                suggestions: [],
        };
    }

    // This method is called whenever the value in the contained <input /> field is changed
    onChange(event, {newValue, method}) {
        this.setState(
            {
                value: newValue,
            }
        );
    }

    setSuggestions(suggestions) {
        if ((typeof(suggestions == "object")) && (suggestions !== null) && (Array.isArray(suggestions))) {
            let managedSuggestions = [];
            let iTo = suggestions.length;
            for (let i=0; i<iTo; i++) {
                let suggestion = suggestions[i];

                if ((typeof(suggestion) === "object") && ("id" in suggestion) && (!isNaN(suggestion.id))) {
                    let id = parseInt(suggestion.id);

                    if (id > 0) {
                        let value = "";
                        let hasTitle = ("title" in suggestion) && (suggestion.title != "");
                        let hasShortCitation = ("short_citation" in suggestion) && (suggestion.short_citation != "");

                        if (hasTitle) {
                            value = suggestion.title + ((hasShortCitation) ? (" (" + suggestion.short_citation + ")") : "");
                        }
                        else if (hasShortCitation) {
                            value = suggestion.short_citation
                        }

                        if (value != "") {
                            managedSuggestions.push(
                                {
                                    id: id,
                                    value: value,
                                }
                            );
                        }
                    }
                }
            }

            this.setState(
                {
                    suggestions: managedSuggestions,
                }
            );
        }
    }

    // This method is called whenever the component needs to update is list of suggestions
    onSuggestionsFetchRequested(term) {
        if (term.value != "") {
            // The value in the contained <input /> field is not empty, call the appropriate HAWC Study API to get suggested Studies
            // The API call returns a JSON-formatted array of objects with 'id' and 'value' keys

            fetch(`${this.props.url}&term=${term.value}`, h.fetchGet)
            .then(response => response.json())
            .then(data => this.setSuggestions(data));
        }
    }

    // This method is called whenever the component needs to clear its displayed list of suggestions
    onSuggestionsClearRequested() {
        this.setState(
            {
                suggestions: []
            }
        );
    }

    // This method is called whenever a Study is selected
    // It is just a pass-thru that calls the injected method for handling the selected Study within the context of the overall Scenario object
    onSuggestionSelected(event, selectedObject) {
        this.onSuggestionsClearRequested();
        this.props.handleStudySelection(this.props.id, selectedObject.suggestion);
    }

    // This method is called whenever a suggestion's value is needed
    getSuggestionValue(suggestion) {
        return suggestion.value;
    }

    // This method renders a suggestion element within the list of options
    renderSuggestion(suggestion) {
        return (
            <span>{suggestion.value}</span>
        );
    }

    render() {
        return(
            <AutoSuggest
                id={this.props.id}
                suggestions={this.state.suggestions}
                onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                onSuggestionSelected={this.onSuggestionSelected}
                getSuggestionValue={this.getSuggestionValue}
                renderSuggestion={this.renderSuggestion}
                inputProps={
                    {
                        placeholder: "Lookup study",
                        value: this.state.value,
                        onChange: this.onChange,
                    }
                }
            />
        );
    }
}


// This function is used to create and then populate the <div> element in the Evidence Profile form that will hold and manage the formset for the Studies
// within this EffectTag
export function renderStudiesFormset(profileId, studies, studyTitles, divId, config) {
    // First, look for the <div> element in the Scenario Effect Tag that will hold the Effect Tags -- this formset will placed be within that element

    if ((divId !== null) && (divId !== "")) {
        // divId is not null and is not an empty string, continue checking it

        // Check the divId against the desired naming convention and attempt to extract the three index values that should be stored within it
        let indices = Array.from(divId.replace(/^stream_(\d+)_(\d+)_(\d+)_effectTag_studiesFormset$/, "$1,$2,$3").split(","), index => parseInt(index));
        if ((indices.length == 3) && (indices[0] >= 1) && (indices[1] >= 1) && (indices[2] >= 1)) {
            // The desired positive index values were found witin divId, now look for the container element within the page's DOM

            let studiesFormsetDiv = document.getElementById(divId);
            if (studiesFormsetDiv !== null) {
                // The <div> element intended to hold this formest exists, render the formset

                ReactDOM.render(
                    <StudiesFormset
                        profileId={profileId}
                        studies={studies}
                        studyTitles={studyTitles}
                        streamIndex={indices[0]}
                        scenarioIndex={indices[1]}
                        effectTagIndex={indices[2]}
                        config={config}
                    />,
                    studiesFormsetDiv
                );
            }
        }
    }
}


export default StudiesFormset;
