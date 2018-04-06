import React, { Component, PropTypes } from 'react';

import ScoreForm from 'robTable/components/ScoreForm';
import Select from 'shared/components/Select';
import './ScoreForm.css';

class EndpointScoreForm extends Component {

    constructor(props){
        super(props);
    }

    componentWillMount(){
    }

    componentWillUpdate(nextProps, nextState) {
    }

    selectEndpoint(){
    }
	
    render() {
        let { updateNotesLeft, endpointText } = this.props, empty = {score:0, notes:'', metric:{name:'',},};
        return (
            <div>
				<h4>{this.props.endpointText}</h4>
				<ScoreForm score={empty} addText={''} updateNotesLeft={this.props.updateNotesLeft} showEPButton={false}/>
            </div>
        );
    }
}

EndpointScoreForm.propTypes = {
    updateNotesLeft: PropTypes.func.isRequired,
	endpointID: PropTypes.string,
	endpointText: PropTypes.string,
};

export default EndpointScoreForm;
