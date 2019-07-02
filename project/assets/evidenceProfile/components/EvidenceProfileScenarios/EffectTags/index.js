import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import AutoSuggest from 'react-autosuggest';

import "./index.css";

import fetch from 'isomorphic-fetch';
import h from 'shared/utils/helpers';

// Set the colors to be used as shades for the alternating Effect Tags within this Scenario
let shade1 = "#EEFFFF";
let shade2 = "#CCFFFF";

// This Component object is the container for this entire Effect Tags formset
class EffectTagsFormset extends Component {
	effectTags = [];
	effectTagReferences = {};

    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        // Set some variables that will be used within this Component
        this.addButtonId = props.config.addButtonIdPattern.replace(/<<streamIndex>>/, this.props.streamIndex).replace(/<<scenarioIndex>>/, this.props.scenarioIndex);
        this.divId = props.config.divIdPattern.replace(/<<streamIndex>>/, this.props.streamIndex).replace(/<<scenarioIndex>>/, this.props.scenarioIndex);
        this.fieldPrefix = props.config.fieldPrefixPattern.replace(/<<streamIndex>>/, this.props.streamIndex).replace(/<<scenarioIndex>>/, this.props.scenarioIndex);
        this.effectTagIdPrefix = props.config.effectTagIdPrefixPattern.replace(/<<streamIndex>>/, this.props.streamIndex).replace(/<<scenarioIndex>>/, this.props.scenarioIndex);
        this.buttonSetPrefix = props.config.buttonSetPrefixPattern.replace(/<<streamIndex>>/, this.props.streamIndex).replace(/<<scenarioIndex>>/, this.props.scenarioIndex);

        // Bind the desired class functions to this object
        this.handleButtonClick = this.handleButtonClick.bind(this);

        // First, look for a "studies" object in the incoming props -- defaulting to an empty array if none is found
        let iterateOverStudies = (("studies" in props) && (typeof(props.studies) === "object") && (props.studies !== null) && (Array.isArray(props.studies))) ? props.studies : [];

        // Iterate over the incoming studies and use them to build the object level "effectTags" and "effectTagReferences" attributes
        let iTo = iterateOverStudies.length;
        for (let i=0; i<iTo; i++) {
            let effectTag = iterateOverStudies[i];

            this.effectTags.push(
                {
                    id: effectTag.effecttag_id,
                    name: (effectTag.effecttag_id in this.props.config.effectTags.index) ? this.props.config.effectTags.index[effectTag.effecttag_id] : "",
                    studies: ("studies" in iterateOverStudies[i]) ? iterateOverStudies[i].studies : [],
                    studyTitles: ("studyTitles" in iterateOverStudies[i]) ? iterateOverStudies[i].studyTitles : {},
                    caption: null,
                    div: null,
                }
            );
        }

        if (this.props.profileId <= 0) {
            // This formset is part of a new Evidence Profile, push an empty Effect Tag onto the end of this.effectTags and increment iTo

            this.effectTags.push(
                {
                    id: null,
                    name: null,
                    studies: [],
                    studyTitles: {},
                    caption: null,
                    div: null,
                }
            );

            iTo++;
        }

        // Iterate through this.effectTag to create the caption and detail <div>s
        for (let i=0; i<iTo; i++) {
            // Create a new EffectTagCaption for this effectTag and place it into the effectTag's "caption" attribute
            this.effectTags[i].caption = <EffectTagCaption
                key={(i + 0.5)}
                ref={
                    (input) => {
                        this.effectTagReferences["caption_" + i] = input;
                    }
                }
                index={i}
                maxIndex={iTo}
                order={(i + 1)}
                name={this.effectTags[i].name}
                divId={this.divId}
                idPrefix={this.effectTagIdPrefix}
                buttonSetPrefix={this.buttonSetPrefix}
                handleButtonClick={this.handleButtonClick}
            />;

            // Create a new EffectTagDiv for this effectTag and place it into the effectTag's "div" attribute
            this.effectTags[i].div = <EffectTagDiv
                key={i}
                ref={
                    (input) => {
                        this.effectTagReferences["div_" + i] = input;
                    }
                }
                index={i}
                maxIndex={(iTo - 1)}
                order={(i + 1)}
                profileId={this.props.profileId}
                pk={this.effectTags[i].id}
                streamIndex={this.props.streamIndex}
                scenarioIndex={this.props.scenarioIndex}
                name={this.effectTags[i].name}
                effectTags_optionSet={this.props.config.effectTags}
                studies={this.effectTags[i].studies}
                studies_optionSet={this.props.config.availableStudies}
                divId={this.divId}
                idPrefix={this.effectTagIdPrefix}
                fieldPrefix={this.fieldPrefix}
                buttonSetPrefix={this.buttonSetPrefix}
                handleButtonClick={this.handleButtonClick}
                effectTagSearchURL={this.props.config.effectTagSearchURL}
                handleEffectTagSelection={this.handleEffectTagSelection}
                effectTagReferences={this.effectTagReferences}
                effectTagCreateURL={this.props.config.effectTagCreateURL}
                csrf_token={this.props.csrf_token}
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
                <strong className="control-label effectTagsSectionTitle">Scenario Studies <em>(organized by effect tag)</em></strong>
                <button id={this.addButtonId} className="btn btn-primary pull-right" type="button" onClick={this.handleButtonClick}>New Effect Tag</button>
                <br className="effectTagsClearBoth" />
                {this.state.divs}
            </div>
        );
    }

    // This function handles the clicking of a button within this formset
    handleButtonClick(event) {
        if ((typeof(event) == "object") && (typeof(event.target) == "object") && (typeof(event.target.id) == "string") && (event.target.id != "")) {
            // The click event's details were passed in, and the clicked-upon element has a non-empty ID attribute, continue checking

            if (event.target.id === this.addButtonId) {
                // The element clicked upon is the "Add A New Effect Tag" button, add a new effectTag to this.effectTags and this.effectTagReferences

                // Get values that will be used within props for the new effectTag <div>
                let newDivIndex = (this.effectTags.length > 0) ? (Math.max(...this.effectTags.map(effectTag => effectTag.div.props.index)) + 1) : 0;
                let effectTagIndex = this.effectTags.length;

                // Push a new, empty effectTag into this.effectTags
                this.effectTags.push(
                    {
                    	id: null,
                    	name: null,
                    	studies: [],
                        studyTitles: {},
                        caption: null,
                        div: null,
                    }
                );

                // Create the new EffectTagCaption component object
                this.effectTags[effectTagIndex].caption = <EffectTagCaption
                    key={(newDivIndex + 0.5)}
                    ref={
                        (input) => {
                            this.effectTagReferences["caption_" + newDivIndex] = input;
                        }
                    }
                    index={newDivIndex}
                    maxIndex={newDivIndex}
                    order={(newDivIndex + 1)}
                    name={this.effectTags[effectTagIndex].name}
                    divId={this.divId}
                    idPrefix={this.effectTagIdPrefix}
                    buttonSetPrefix={this.buttonSetPrefix}
                    handleButtonClick={this.handleButtonClick}
                />;

                // Create the new EffectTagDiv component object
                this.effectTags[effectTagIndex].div = <EffectTagDiv
                    key={newDivIndex}
                    ref={
                        (input) => {
                            this.effectTagReferences["div_" + newDivIndex] = input;
                        }
                    }
                    index={newDivIndex}
                    maxIndex={newDivIndex}
                    order={(newDivIndex + 1)}
                    profileId={this.props.profileId}
                    pk={this.effectTags[effectTagIndex].id}
                    streamIndex={this.props.streamIndex}
                    scenarioIndex={this.props.scenarioIndex}
                    name={this.effectTags[effectTagIndex].name}
                    effectTags_optionSet={this.props.config.effectTags}
                    studies={this.effectTags[effectTagIndex].studies}
                    studies_optionSet={this.props.config.availableStudies}
                    divId={this.divId}
                    idPrefix={this.effectTagIdPrefix}
                    fieldPrefix={this.fieldPrefix}
                    buttonSetPrefix={this.buttonSetPrefix}
                    handleButtonClick={this.handleButtonClick}
                    effectTagSearchURL={this.props.config.effectTagSearchURL}
                    handleEffectTagSelection={this.handleEffectTagSelection}
	                effectTagReferences={this.effectTagReferences}
                    effectTagCreateURL={this.props.config.effectTagCreateURL}
                    csrf_token={this.props.csrf_token}
                />;

                // Set this.state.divs to the new divs array (including the new effectTag added to the end)
                this.setState(
                    {
                        divs: this.buildDivs(),
                    }
                );
            }
            else {
                // The element clicked upon is either a "Move Up," "Move Down," "Remove," "Show" or "Hide" button from a <div> within the formset,
                // attempt to handle it

                let countEffectTags = this.effectTags.length;
                let buttonDetails = event.target.id.replace(this.props.config.buttonSetRegEx, "$1,$2,$3,$4").split(",");

                if ((buttonDetails.length == 4) && (buttonDetails[0] !== "") && (buttonDetails[1] !== "") && (buttonDetails[2] !== "") && (buttonDetails[3] !== "")) {
                    // Three non-empty details were extracted from the clicked-upon element's ID, continue

                    buttonDetails[0] = parseInt(buttonDetails[0]);
                    buttonDetails[1] = parseInt(buttonDetails[1]);
                    buttonDetails[2] = parseInt(buttonDetails[2]);

                    if ((buttonDetails[0] === this.props.streamIndex) && (buttonDetails[1] === this.props.scenarioIndex) && (buttonDetails[2] >= 1)) {
                        // The first button detail matches the streamIndex, the second button detail matches the scenarioIndex, and the third button detail
                        // is a potentially valid index for an EffectTag div

                        let effectTagIndex = this.findEffectTagIndex(buttonDetails[2]);
                        if (effectTagIndex > -1) {
                            // The <div> was found within this.effectTags, keep working with it

                            buttonDetails[3] = buttonDetails[3].toLowerCase();
                            if ((buttonDetails[3] === "moveup") && (effectTagIndex > 0)) {
                                // The user clicked on the "Move Up" button and the scenario is not at the top of the list, move it up in the list

                                let temp = this.effectTags[effectTagIndex];
                                this.effectTags[effectTagIndex] = this.effectTags[effectTagIndex - 1];
                                this.effectTags[effectTagIndex - 1] = temp;

                                this.setState(
                                    {
                                        divs: this.buildDivs(),
                                    }
                                );
                            }
                            else if ((buttonDetails[3] === "movedown") && (effectTagIndex < (this.effectTags.length - 1))) {
                                // The user clicked on the "Move Down" button and the scenario is not at the bottom of the list, move it down
                                // in the list

                                let temp = this.effectTags[effectTagIndex];
                                this.effectTags[effectTagIndex] = this.effectTags[effectTagIndex + 1];
                                this.effectTags[effectTagIndex + 1] = temp;

                                this.setState(
                                    {
                                        divs: this.buildDivs(),
                                    }
                                );
                            }
                            else if (buttonDetails[3] === "remove") {
                                // The user clicked on the "Remove" button, remove the <div>

                                this.effectTags.splice(effectTagIndex, 1);
                                this.setState(
                                    {
                                        divs: this.buildDivs(),
                                    }
                                );
                            }
                            else if (buttonDetails[3] === "showeffecttag") {
                                // The clicked-upon element is a "Show" button, change the "display" styles for this effectTag's caption and
                                // detail <div>s accordingly
                                this.effectTagReferences["caption_" + this.effectTags[effectTagIndex].div.props.index].captionReference.style.display = "none";
                                this.effectTagReferences["div_" + this.effectTags[effectTagIndex].div.props.index].effectTagReference.style.display = "block";
                            }
                            else if (buttonDetails[3] === "hideeffecttag") {
                                // The clicked-upon element is a "Hide" button, change the "display" styles for this effectTag's caption and
                                // detail <div>s accordingly

                                this.effectTagReferences["caption_" + this.effectTags[effectTagIndex].div.props.index].captionReference.style.display = "block";
                                this.effectTagReferences["div_" + this.effectTags[effectTagIndex].div.props.index].effectTagReference.style.display = "none";
                            }
                        }
                    }
                }
            }
        }
    }

    // This method is called when an Effect Tag is selected within this formset
    handleEffectTagSelection(id, effectTag, effectTagCaption, effectTagCreateURL, csrf_token) {
        let idMatcher = new RegExp("^(stream_\\d+_\\d_\\d_effectTag)_suggest$", "gi");

        if (
            (typeof(id) === "string") && (id != "") && (id.match(idMatcher))
            && (typeof(effectTag) === "object") && (effectTag !== null)
            && ("id" in effectTag) && (typeof(effectTag.id) === "number") && (effectTag.id >= 0)
            && ("value" in effectTag) && (effectTag.value !== "")
        ) {
            // The following things are true about the incoming arguments:
            //      * id is a non-empty string that matches the expected naming convention
            //      * effectTag is an non-NULL object
            //      * effectTag.id is a number zero or greater
            //      * effectTag.value is a non-empty string
            // Handle this tag selection

            let effectTagIdField = document.getElementById(id.replace(idMatcher, "$1_pk"));
            if (effectTagIdField !== null) {
                // The expected DOM element was found, do some more checking

                if (effectTag.id === 0) {
                    // This is a new Effect Tag, confirm that the user wants to add this new tag
                    if (confirm('Confirm that you want to create a new Effect Tag named "' + effectTag.value + '"')) {
                        let errorMessage = [];

                        if ((effectTagCreateURL === null) || (effectTagCreateURL === "")) {
                            // effectTagCreateURL is either NULL or an empty string, set errorMessage accordingly
                            errorMessage[errorMessage.length] = "No API URL Was Found For Adding A New Effect Tag";
                        }

                        if ((csrf_token === null) || (csrf_token === "")) {
                            // csrf_token is either NULL or an empty string, set errorMessage accordingly
                            errorMessage[errorMessage.length] = "No Anti-Forgery (CSRF) Token Was Found For Adding A New Effect Tag";
                        }

                        if (errorMessage.length === 0) {
                            // No error messages where generated, attempt to submit it to HAWC for creating and then set effectTag.id accordingly

                            // Build an object containing the data to be submitted to HAWC for creating this new EffectTag
                            let formData = new FormData();
                            formData.append("csrfmiddlewaretoken", csrf_token);
                            formData.append("name", effectTag.value);

                            // Submit the data to HAWC and them handle the response
                            fetch(
                                effectTagCreateURL,
                                {
                                    method: "post",
                                    body: formData,
                                }
                            )
                            .then(response => response.json())
                            .then(
                                function(data) {
                                    if (
                                        (data !== null) && (typeof(data) === "object") && (Array.isArray(data))
                                        && (data.length >= 1) && (data[0] !== null) && (typeof(data[0]) === "object")
                                        && ("id" in data[0]) && (typeof(data[0].id) === "number") &&(data[0].id >= 1)
                                    ) {
                                        // The data returned from the HAWC server had the following qualities:
                                        //      * Is it an array with at least one element
                                        //      * The first element in the array is a non-empty object
                                        //      * The first element in the array includes a numeric ID value that is one or greater (i.e. it is a syntactically-valid
                                        //        primary key value in HAWK)
                                        // This new Effect Tag was created successfully (or the original was returned if this "new" tag was a duplicate), copy its
                                        // new(?) primary key to effectTag.id

                                        // The code below is very similar to code executed whenever the incoming effectTag's id value is already greater than zero
                                        // This is because the fetch() process is asynchronous, and was not processed by the time the code got to where code
                                        // could be executed for either situation
                                        // This can be abstracted out into a separate function at some point, but only being used in two places isn't a tragedy

                                        effectTagIdField.value = Math.floor(data[0].id);

                                        let effectTagNameField = document.getElementById(id.replace(idMatcher, "$1_name"));
                                        if (effectTagNameField !== null) {
                                            // The expected field that holds the tag name's text was found, place the selected suggestion's name in it
                                            effectTagNameField.innerHTML = effectTag.value;
                                        }

                                        // Look for a reference to this parent Effect Tag's companion caption object
                                        if ((typeof(effectTagCaption) === "object") && (effectTagCaption !== null)) {
                                            // effectTagCaption is a non-NULL object, attempt to set its state with the value of this name
                                            effectTagCaption.setState(
                                                {
                                                    name: effectTag.value,
                                                }
                                            );
                                        }
                                    }
                                }
                            );
                        }
                        else {
                            // At least one error message was generated, display them in an alert
                            alert(errorMessage.join("\n"));
                        }
                    }
                }
                else {
                    // This is an existing Effect Tag, copy its id value to the relevant DOM element
                    effectTagIdField.value = Math.floor(effectTag.id);

                    let effectTagNameField = document.getElementById(id.replace(idMatcher, "$1_name"));
                    if (effectTagNameField !== null) {
                        // The expected field that holds the tag name's text was found, place the selected suggestion's name in it
                        effectTagNameField.innerHTML = effectTag.value;
                    }

                    // Look for a reference to this parent Effect Tag's companion caption object
                    if ((typeof(effectTagCaption) === "object") && (effectTagCaption !== null)) {
                        // effectTagCaption is a non-NULL object, attempt to set its state with the value of this name
                        effectTagCaption.setState(
                            {
                                name: effectTag.value,
                            }
                        );
                    }
                }
            }
        }
    }

    // After this Component has been updated (i.e. a <div> added, removed or moved up/down), this method runs to re-color the <div>s and set
    // button visibility
    componentDidUpdate() {
        let iTo = this.effectTags.length;
        let iMax = iTo - 1;

        for (let i=0; i<iTo; i++) {
            let reference = this.effectTagReferences["div_" + this.effectTags[i].div.props.index];

            // Alternate the <div> color on effectTags
            reference.effectTagReference.style.backgroundColor = ((i % 2) === 0) ? shade1 : shade2;

            // Only make the "Move Up" button visible whenever it is not in the first effectTag
            reference.moveUpReference.style.visibility = (i === 0) ? "hidden" : "visible";

            // Only make the "Move Down" button visible whenever it is not in the last effectTag
            reference.moveDownReference.style.visibility = (i === iMax) ? "hidden" : "visible";

            // Set the value of the ordering <input />'s value for this effectTag's <div>
            reference.orderReference.setState(
                {
                    value: (i + 1),
                }
            );
        }
    }

    // This method attempts to find the array index of the element in this.effectTags that contains the <EffectTagDiv> element
    // whose index is the passed-in argument value
    // The this.effectTags array indices and the EffectTagReference elements' index values are initially the same; but as rows get
    // moved up and down, that changes -- making this method necessary
    findEffectTagIndex(index) {
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
                let iTo = this.effectTags.length;

                // Iterate through this.effectTags until we either reach the end or find the element that contains the formset row being sought
                while ((returnValue === -1) && (i < iTo)) {
                    if (this.effectTags[i].div.props.index === index) {
                        // The desired formset div was found, save i as returnValue
                        returnValue = i;
                    }

                    i++;
                }
            }
        }

        return returnValue;
    }

    // This method iterates over this.effectTags and builds an array containing each effectTag's caption and detail <div>s
    buildDivs() {
        let returnValue = [];
        let iTo = this.effectTags.length;

        for (let i=0; i<iTo; i++) {
            returnValue.push(this.effectTags[i].caption);
            returnValue.push(this.effectTags[i].div);
        }

        return returnValue;
    }
}


// This object is a single Evidence Profile Effect Tag caption
class EffectTagCaption extends Component {
    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        this.state = {
            name: (this.props.name !== null) ? this.props.name : "",
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
                        display: "block",
                    }
                }
                className={"effectTagCaptionDiv"}
            >
                <div className={"effectTagCaption_button"}>
                    <button
                        ref={
                            (input) => {
                                this.showEffectTagReference = input;
                            }
                        }
                        className={"btn btn-mini showEffectTagButton"}
                        title={"show effect tag"}
                        type={"button"}
                        onClick={
                            (e) => this.props.handleButtonClick(e)
                        }
                     >
                        <i id={this.props.buttonSetPrefix + "_" + (this.props.index + 1) + "_showeffecttag"} className={"icon-plus"} />
                    </button>
                </div>
                <div className={"effectTagCaption_name"}>
                    {(this.state.name !== "") ? <strong><em>{this.state.name}</em></strong> : "[No Tag Yet]"}
                </div>
            </div>
        );
    }
}


// This object is a single Scenario Effect Tag form fragment
class EffectTagDiv extends Component {
    constructor(props) {
       // First, call the super-class's constructor
        super(props);

        // Copy syntactically valid versions of these properties to this object, defaulting to desired values if the property is missing or invalid
        this.pk = (("pk" in this.props) && (this.props.pk !== null) && (typeof(this.props.pk) === "number")) ? this.props.pk : 0;
        this.name = (("name" in this.props) && (this.props.name !== null)) ? this.props.name : "";

        // These fields will get used multiple times each, so it is a good idea to go ahead and declare them
        this.plusOne = this.props.index + 1;
        this.fieldPrefix = this.props.fieldPrefix + "_" + this.plusOne + "_effectTag";
        this.buttonSetPrefix = this.props.buttonSetPrefix + "_" + this.plusOne;

        /*
        var studies = this.props.studies;
        this.studyOptionSet = this.props.studies_optionSet.studies.map(
            function(currentValue, index) {
                let optionValue = parseInt(Object.keys(currentValue)[0]);
                return <option key={index} value={optionValue}>{currentValue[optionValue]}</option>;
            }
        );
        */
    }

    render() {
        return (
            <div
                ref={
                    (input) => {
                        this.effectTagReference = input;
                    }
                }
                id={this.props.idPrefix + "_" + this.props.order}
                className="effectTagDiv"
                style={
                    {
                        backgroundColor:(((this.plusOne % 2) === 0) ? shade2 : shade1),
                        display: "none",
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

                <div className={"effectTagDivRow"}>
                    <div className={"effectTagDiv_leftButton"}>
                        <button
                            ref={
                                (input) => {
                                    this.hideEffectTagReference = input;
                                }
                            }
                            className={"btn btn-mini"}
                            title={"hide effect tag"}
                            type={"button"}
                            onClick={
                                (e) => this.props.handleButtonClick(e)
                            }
                        >
                            <i id={this.buttonSetPrefix + "_hideeffecttag"} className="icon-minus" />
                        </button>
                    </div>

                    <div className={"effectTagDiv_details"}>
                        <input id={this.fieldPrefix + "_pk"} type="hidden" name={this.fieldPrefix + "_pk"} value={this.pk} />
                        <span id={this.fieldPrefix + "_name"}>{this.name}</span>

                        <label htmlFor={this.fieldPrefix + "_suggest"} className="control-label">{((this.pk !== "") && (this.pk >= 1)) ? "Change Effect Tag" : "Effect Tag"}</label>
                        <EffectTagAutoSuggest
                            id={this.fieldPrefix + "_suggest"}
                            placeholder={"Effect Tag..."}
                            effectTagSearchURL={this.props.effectTagSearchURL}
                            handleEffectTagSelection={this.props.handleEffectTagSelection}
                            value={""}
                            csrf_token={this.props.csrf_token}
                            effectTagCreateURL={this.props.effectTagCreateURL}
                            index={this.props.index}
                            effectTagReferences={this.props.effectTagReferences}
                        />

                        <strong>Studies Within This Tag</strong><br />
                        <EffectTagStudies
                            id={this.fieldPrefix + "_studies"}
                            name={this.fieldPrefix + "_studies"}
                            value={this.props.studies}
                            optionSet={this.props.studies_optionSet}
                        />
                    </div>

                    <div className={"effectTagDiv_rightButtons"}>
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

                <br className={"effectTagsClearBoth"} />
            </div>
        )
    }
}


// This Component class is used to create an input field for a single effectTag's order within the set of effectTags
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


// This Component class is used to create an auto-suggest field for looking up an Effect Tag
class EffectTagAutoSuggest extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its necessary methods
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
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

    // This method is called whenever a key is pressed while the cursor is in this field, it is intended to intersecpt any "Enter" key presses and
    // prevent them from submitting the form
    onKeyDown(event) {
        if (event.key === "Enter") {
            // The enter key was pressed, prevent its default activity (i.e. submission of the form)
            event.preventDefault();
        }
    }

    setSuggestions(suggestions) {
        if ((typeof(suggestions == "object")) && (suggestions !== null) && (Array.isArray(suggestions))) {
            // Suggestions is an array, iterate over it and build the set of suggestions that will be presented to the user

            let managedSuggestions = [
                {
                    id: 0,
                    value: this.state.value,
                }
            ];

            let iTo = suggestions.length;
            for (let i=0; i<iTo; i++) {
                let suggestion = suggestions[i];

                if ((typeof(suggestion) === "object") && ("id" in suggestion) && (!isNaN(suggestion.id))) {
                    // So far, this suggestion seems okay, continue
                    let id = parseInt(suggestion.id);

                    if (id > 0) {
                        // This suggestion has a syntactically value primary key, look for a name

                        let value = (("name" in suggestion) && (suggestion.name !== "")) ? suggestion.name : "";
                        if (value != "") {
                            // This suggestion has a name, add it to the array of suggestions that will be presented to the user
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

            fetch(`${this.props.effectTagSearchURL}&term=${term.value}`, h.fetchGet)
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

        this.props.handleEffectTagSelection(
            this.props.id,
            selectedObject.suggestion,
            this.props.effectTagReferences["caption_" + this.props.index],
            this.props.effectTagCreateURL,
            this.props.csrf_token
        );
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
                        placeholder: "Lookup Effect Tag",
                        value: this.state.value,
                        onChange: this.onChange,
                        onKeyDown: this.onKeyDown,
                    }
                }
            />
        );
    }
}


// This Component class is used to create a select multiple field for the studies included within this effect tag
class EffectTagStudies extends Component {
    constructor(props) {
        // First, call the super-class's constructor and properly bind its updateField method
        super(props);
        this.updateField = this.updateField.bind(this);

        // Make sure that the value saved in state is an array object
        // If the incoming value came in as a simple value, save it as the only element in a single-element array
        this.state = {
            value: (Array.isArray(this.props.value)) ? this.props.value : [this.props.value]
        };
    }

    updateField(event) {
        // var newValue = Array.from(event.target.selectedOptions, (item) => item.value);
        this.setState(
            {
                value: Array.from(event.target.selectedOptions, (item) => item.value)
            }
        );
    }

    // Place the desired input element on the page
    render() {
        return (
            <select
                multiple="multiple"
                className="span12 selectmultiple"
                size="10"
                id={this.props.id}
                name={this.props.name}
                value={this.state.value}
                onChange={(e) => this.updateField(e)}
            >
                {
                    this.props.optionSet.studies.map(
                        function(currentValue, index) {
                            var optionValue = Object.keys(currentValue)[0];
                            return <option key={index} value={optionValue}>{currentValue[optionValue]}</option>;
                        }
                    )
                }
            </select>
        );
    }
}


// This function is used to create and then populate the <div> element in the Evidence Profile form that will hold and manage the formset for the Effect Tags
// within this Scenario
export function renderEffectTagsFormset(profileId, studies, divId, config, csrf_token) {
    // First, look for the <div> element in the Stream Scenario that will hold the Effect Tags -- this formset will placed be within that element

    if ((divId !== null) && (divId !== "")) {
        // divId is not null and is not an empty string, continue checking it

        let indices = divId.replace(/^stream_(\d+)_(\d+)_scenario_effectTagsFormset$/, "$1,$2");
        if (indices !== "") {
        	// divId matches the expected naming convention, extract the stream and scenario indices

        	indices = indices.split(",");
        	if ((indices.length == 2) && (!isNaN(indices[0])) && (indices[0] >= 1) && (!isNaN(indices[1])) && (indices[1] >= 1)) {
        		// indices consists of two numbers greater than or equal to one, continue working with them

        		indices[0] = parseInt(indices[0]);
        		indices[1] = parseInt(indices[1]);
	            let effectTagsFormsetDiv = document.getElementById(divId);
	            if (effectTagsFormsetDiv !== null) {
	            	// The <div> element intended to hold this formset exists, render the formset

                    ReactDOM.render(
                        <EffectTagsFormset
                            profileId={profileId}
                            studies={studies}
                            streamIndex={indices[0]}
                            scenarioIndex={indices[1]}
                            config={config}
                            csrf_token={csrf_token}
                        />,
                        effectTagsFormsetDiv
                    );
	            }
        	}
		}
	}
}


export default EffectTagsFormset;
