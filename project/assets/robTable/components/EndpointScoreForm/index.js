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
			this.state.endpointID = this.state.endpointID+"."+this.props.index;
        this.handleEPEditorInput = this.handleEPEditorInput.bind(this);
        this.selectEPScore = this.selectEPScore.bind(this);
    }

    componentWillMount(){
        this.selectEPScore(this.props.endpoint.score);
    }

    componentWillUpdate(nextProps, nextState) {
        // update notes if addText is modified
        // (usually by copying notes over from another form)
        if(nextProps.addText !== this.props.addText){
            this.setState({
                notes: this.state.notes + nextProps.addText,
            });
        }
        // if score notes is changed, change notes to new notes
        if(nextProps.endpoint.notes !== this.state.notes){
            this.setState({
                notes: nextProps.endpoint.notes,
            });
        }
        // if score is changed, change to new score
        if (nextProps.endpoint.score !== this.state.score) {
            this.selectScore(nextProps.endpoint.score);
        }
    }

    handleEPEditorInput(event){
		var tempNotes = event.toString();
        this.state.notes = tempNotes;
        //this.validateInput(this.state.score, event);
    }

    validateInput(score, notes){
        if (this.state.notes.replace(/<\/?[^>]+(>|$)/g, '') == '' && score != 0) {
            this.props.updateNotesLeft(this.props.endpoint.id, 'add');
        } else {
            this.props.updateNotesLeft(this.props.endpoint.id, 'clear');
        }
    }

    selectEPScore(score){
        this.setState({
            score,
            selectedShade: this.state.scoreShades[score],
            selectedSymbol: this.state.scoreSymbols[score],
        });
       // this.validateInput(score, this.state.notes);
    }
	
    render() {
        let { updateNotesLeft, endpointText, score} = this.props, empty = {score:0, notes:'', metric:{name:'',},};
        let { scoreChoices, scoreSymbols, scoreShades, selectedSymbol, selectedShade, notes, metric, } = this.state;

        return (
            <fieldset>
				<h4>{this.props.endpointText}</h4>
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
        baseendpoint: PropTypes.number.isRequired,
		metric: PropTypes.shape({
            name: PropTypes.string,
            answers: PropTypes.array,
        }),
    }).isRequired,
    updateNotesLeft: PropTypes.func.isRequired,
};

export default EndpointScoreForm;
