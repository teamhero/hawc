import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

class EvidenceProfileStreamFormset extends Component {
	constructor(props) {
		super(props);

		this.state = {
			"streams": []
		};
	}

	render() {
		return (
			<h1>Dude, The Profile Stream Formset Works!</h1>
		);
	}
}

export function renderStreamFormSet(streams, element) {
    ReactDOM.render(<EvidenceProfileStreamFormset />, element);
}

export default EvidenceProfileStreamFormset;
