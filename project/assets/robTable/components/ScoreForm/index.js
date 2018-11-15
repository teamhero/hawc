import React, { Component, PropTypes } from 'react';
import ReactQuill from 'react-quill';

import ScoreIcon from 'robTable/components/ScoreIcon';
import EndpointScoreForm from 'robTable/components/EndpointScoreForm';
import Select from 'shared/components/Select';
import './ScoreForm.css';

class ScoreForm extends Component {

    constructor(props){
        super(props);
        if (props.score.metric.answers.length > 0) {
            var choices = {};
            var symbols = {};
            var shades = {};

            for (var i=0; i < props.score.metric.answers.length; i++) {
                var choice = props.score.metric.answers[i].choice;
                var symbol = props.score.metric.answers[i].symbol;
                var shade = props.score.metric.answers[i].shade;
                var answerScore = props.score.metric.answers[i].answer_score;
            
                choices[answerScore] = choice;
                symbols[answerScore] = symbol;
                shades[answerScore] = shade;
            }

            this.state = {
                scoreChoices: choices ,
                scoreSymbols: symbols,
                scoreShades: shades,
                score: null,
                notes: props.score.notes,
				endpointChoices: this.props.endpoints,
				endpointIDs: [],
            }
        }
        else {
            this.state = {
                scoreSymbols: {0: 'N/A', 1: '--', 2: '-', 3: '+', 4: '++', 10: 'NR'},
                scoreShades: {
                    0: '#E8E8E8',
                    1: '#CC3333',
                    2: '#FFCC00',
                    3: '#6FFF00',
                    4: '#00CC00',
                    10: '#FFCC00',
                },
                scoreChoices: {
                    0: 'Not applicable',
                    1: 'Critically deficient',
                    2: 'Poor',
                    3: 'Adequate',
                    4: 'Good',
                    10: 'Not reported',
                },
                score: null,
                notes: props.score.notes,
 				endpointChoices: this.props.endpoints,
				endpointIDs: [],
           };
        }
		
        this.handleEditorInput = this.handleEditorInput.bind(this);
        this.selectScore = this.selectScore.bind(this);
        this.selectEndpoint = this.selectEndpoint.bind(this);
        this.addGenericEndpoint = this.addGenericEndpoint.bind(this);
        this.handleEPEditorInput = this.handleEPEditorInput.bind(this);
        this.selectEPScore = this.selectEPScore.bind(this);
    }

    componentWillMount(){
        this.selectScore(this.props.score.score);
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
        if(nextProps.score.notes !== this.props.score.notes){
            this.setState({
                notes: nextProps.score.notes,
            });
        }
        // if score is changed, change to new score
        if (nextProps.score.score !== this.props.score.score) {
            this.selectScore(nextProps.score.score);
        }
    }

    selectScore(score){
        this.setState({
            score,
            selectedShade: this.state.scoreShades[score],
            selectedSymbol: this.state.scoreSymbols[score],
        });
        this.validateInput(score, this.state.notes);
    }

    selectEPScore(score){
        this.setState({
            score,
            selectedShade: this.state.scoreShades[score],
            selectedSymbol: this.state.scoreSymbols[score],
        });
    }
	
    handleEditorInput(event){
        this.setState({notes: event});
        this.validateInput(this.state.score, event);
    }

    handleEPEditorInput(event){
        this.setState({EPnotes: event});
        this.validateInput(this.state.score, event);
    }

    validateInput(score, notes){
        if (this.state.notes.replace(/<\/?[^>]+(>|$)/g, '') == '' && score != 0) {
            this.props.updateNotesLeft(this.props.score.id, 'add');
        } else {
            this.props.updateNotesLeft(this.props.score.id, 'clear');
        }
    }

    addGenericEndpoint(e){
		e.preventDefault();
		this.state.endpointIDs.push(0);
		this.forceUpdate();
    }

    selectEndpoint(endpoint){
		this.state.endpointIDs.push(endpoint);
		this.forceUpdate();
    }

    render() {
		const endpointScores = [];
		//const EPButton = this.props.showEPButton;
		
        let endpointAddControl, { name } = this.props.score.metric,
            { scoreChoices, scoreSymbols, scoreShades, score, notes, selectedSymbol, selectedShade, endpointChoices, endpointIDs } = this.state;

		endpointAddControl = _.isEmpty(endpointChoices) ?
		    <button onClick={this.addGenericEndpoint}>Endpoint TBA</button> :
		    <Select choices={endpointChoices} id={name+'_ep'} handleSelect={this.selectEndpoint} />;
			
		if (this.props.showEPButton)
        return (
			<div>
            <div className='score-form'>
                <div>
                    <Select choices={scoreChoices}
                          id={name}
                          value={score}
                          handleSelect={this.selectScore}/>
                    <br/><br/>
                    <ScoreIcon shade={selectedShade}
                             symbol={selectedSymbol}/>
					<br/>
					Add notes for an endpoint:<br/>
					{endpointAddControl}
                </div>
                <ReactQuill id={name}
                         value={notes}
                         onChange={this.handleEditorInput}
                         toolbar={false}
                         theme='snow'
                         className='score-editor' />
            </div>
			<div>
			{_.map(endpointIDs, (endpoint, index) => { 
				if (endpoint==0)
					return <EndpointScoreForm ref={'epform'+endpoint+'.'+index} key={endpoint+'.'+index} updateNotesLeft={this.props.updateNotesLeft} endpointID={endpoint+'.'+index} endpointText={'Endpoint Notes'} scoreChoices={scoreChoices} scoreSymbols={scoreSymbols} scoreShades={scoreShades} score={score} robpeID={'0'} />;
				else
					return <EndpointScoreForm ref={'epform'+endpoint} key={endpoint} updateNotesLeft={this.props.updateNotesLeft} endpointID={endpoint} endpointText={endpointChoices[endpoint]} scoreChoices={scoreChoices} scoreSymbols={scoreSymbols} scoreShades={scoreShades} score={score} robpeID={(index/1000).toString()} />;
            })}
			</div>
			</div>
        );
		else
        return (
			<div>
            <div className='score-form'>
                <div>
                    <Select choices={scoreChoices}
                          id={name}
                          value={score}
                          handleSelect={this.selectScore}/>
                    <br/><br/>
                    <ScoreIcon shade={selectedShade}
                             symbol={selectedSymbol}/>
                </div>
                <ReactQuill id={name}
                         value={notes}
                         onChange={this.handleEditorInput}
                         toolbar={false}
                         theme='snow'
                         className='score-editor' />
            </div>
			<div>{endpointScores}</div>
			</div>
        );
    }
}

ScoreForm.defaultProps = {
	showEPButton: true,
};

ScoreForm.propTypes = {
    score: PropTypes.shape({
        score: PropTypes.number.isRequired,
        notes: PropTypes.string.isRequired,
        metric: PropTypes.shape({
            name: PropTypes.string.isRequired,
            answers: PropTypes.array,
        }).isRequired,
    }).isRequired,
    updateNotesLeft: PropTypes.func.isRequired,
	showEPButton: PropTypes.bool,
};

export default ScoreForm;
