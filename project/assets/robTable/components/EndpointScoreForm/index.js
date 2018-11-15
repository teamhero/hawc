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
			score: this.props.score,
			metric: this.props.metric,
			endpointID: this.props.endpointID,
 			robpeID: this.props.robpeID,
			EPnotes: '',
		}
        this.handleEPEditorInput = this.handleEPEditorInput.bind(this);
        this.selectEPScore = this.selectEPScore.bind(this);
    }

    componentWillMount(){
        this.selectEPScore(this.props.score);
    }

    componentWillUpdate(nextProps, nextState) {
        // update notes if addText is modified
        // (usually by copying notes over from another form)
        if(nextProps.addText !== this.props.addText){
            this.setState({
                EPnotes: this.state.EPnotes + nextProps.addText,
            });
        }
        // if score notes is changed, change notes to new notes
        if(nextProps.score.EPnotes !== this.props.score.EPnotes){
            this.setState({
                EPnotes: nextProps.score.EPnotes,
            });
        }
        // if score is changed, change to new score
        if (nextProps.score.score !== this.props.score.score) {
            this.selectScore(nextProps.score.score);
        }
    }

    handleEPEditorInput(event){
        this.setState({EPnotes: event});
        this.validateInput(this.state.score, event);
    }

    validateInput(score, EPnotes){
        if (this.state.EPnotes.replace(/<\/?[^>]+(>|$)/g, '') == '' && score != 0) {
            this.props.updateNotesLeft(this.props.score.id, 'add');
        } else {
            this.props.updateNotesLeft(this.props.score.id, 'clear');
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
        let { scoreChoices, scoreSymbols, scoreShades, selectedSymbol, selectedShade, EPnotes, metric, } = this.state;

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
					<ReactQuill id={this.state.metric+".notes"+this.state.endpointID}
							 value={EPnotes}
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
    updateNotesLeft: PropTypes.func.isRequired,
	endpointID: PropTypes.string,
	endpointText: PropTypes.string,
	robpeID: PropTypes.string,
};

export default EndpointScoreForm;
