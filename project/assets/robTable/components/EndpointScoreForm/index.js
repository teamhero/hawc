import React, { Component, PropTypes } from 'react';
import ReactQuill from 'react-quill';

import ScoreForm from 'robTable/components/ScoreForm';
import ScoreIcon from 'robTable/components/ScoreIcon';
import Select from 'shared/components/Select';
import './ScoreForm.css';

class EndpointScoreForm extends Component {

    constructor(props){
        super(props);
		this.state = {
			scoreChoices: this.props.scoreChoices,
			scoreShades: this.props.scoreShades,
            scoreSymbols: this.props.scoreSymbols,
			score: this.props.endpoint.score,
			metric: this.props.endpoint.metric.id,
			endpointID: this.props.endpoint.id,
			baseEndpointId: this.props.endpoint.baseendpoint,
			notes: this.props.endpoint.notes,
		}
		if (this.state.endpointID == 0)
			this.state.endpointID = this.state.endpointID+"."+this.props.index+this.props.endpoint.metric.id;
        this.handleEPEditorInput = this.handleEPEditorInput.bind(this);
        this.selectEPScore = this.selectEPScore.bind(this);
        this.selectEndpointforNote = this.selectEndpointforNote.bind(this);
    }

    componentWillMount(){
        this.selectEPScore(this.state.score);
    }

    componentWillUpdate(nextProps, nextState) {
        // update notes if addText is modified
        // (usually by copying notes over from another form)
        if(nextProps.addText !== this.props.addText){
            this.setState({
                notes: this.state.notes + nextProps.addText,
            });
        }
    }

    handleEPEditorInput(event){
		var tempNotes = event.toString();
        this.state.notes = tempNotes;
    }


    selectEPScore(score){
        this.setState({
            score,
            selectedShade: this.state.scoreShades[score],
            selectedSymbol: this.state.scoreSymbols[score],
        });
    }
	
    selectEndpointforNote(endpoint){
		this.setState({
			baseEndpointId: parseInt(endpoint)
		});
    }
	
    render() {
        let { updateNotesLeft, endpointText, score, endpointChoices} = this.props, empty = {score:0, notes:'', metric:{name:'',},};
        let { scoreChoices, scoreSymbols, scoreShades, selectedSymbol, selectedShade, notes, metric, } = this.state;
		let addEndpoint =  _.isEmpty(endpointChoices)? false : !this.props.endpoint.baseendpoint;

        return (
            <fieldset>
				<div className='btn-group pull-right'>
					<button className='btn btn-mini btn-danger' onClick={(e) => this.props.removeEndpoint(this.state.endpointID, e)}><i className='fa fa-lg fa-times'></i> Delete</button>
				</div>
				<h4>{addEndpoint?'Select the Endpoint':this.props.endpointText}</h4>
				{addEndpoint?(<Select choices={endpointChoices} id={name+'_ep'} handleSelect={this.selectEndpointforNote} />) : null}			
				<div className='score-form'>
					<div>
						<Select choices={this.state.scoreChoices}
							  id={this.state.metric+".ep"+this.state.endpointID}
							  value={this.state.score}
							  handleSelect={this.selectEPScore}/>
						<br/><br/>
						<ScoreIcon shade={selectedShade}
								 symbol={selectedSymbol}/>
					</div>
					<ReactQuill id={this.state.metric+"notes"+this.state.endpointID}
							 value={notes}
							 onChange={this.handleEPEditorInput}
							 toolbar={false}
							 theme='snow'
							 className='score-editor' />
				</div>
            </fieldset>
        );
    }
}

EndpointScoreForm.propTypes = {
    endpoint: PropTypes.shape({
        id: PropTypes.number.isRequired,
        score: PropTypes.number.isRequired,
        notes: PropTypes.string,
        baseendpoint: PropTypes.number,
		metric: PropTypes.shape({
            name: PropTypes.string,
            answers: PropTypes.array,
        }),
    }).isRequired,
    updateNotesLeft: PropTypes.func.isRequired,
};

export default EndpointScoreForm;
