import React, { Component, PropTypes } from 'react';
import ReactQuill from 'react-quill';

import ScoreIcon from 'robTable/components/ScoreIcon';
import EndpointScoreForm from 'robTable/components/EndpointScoreForm';
import Select from 'shared/components/Select';
import './ScoreForm.css';


class ScoreForm extends Component {

    constructor(props){
        super(props);
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
			numEndpointScores: 0,
            endpointChoices: {
                0: 'Endpoint 1',
                1: 'Endpoint 2',
                2: 'Endpoint 3',
                3: 'Endpoint 4',
                4: 'Endpoint 5',
            },
			endpointID: null,
			endpointText: null,
        };
        this.handleEditorInput = this.handleEditorInput.bind(this);
        this.selectScore = this.selectScore.bind(this);
        this.selectEndpoint = this.selectEndpoint.bind(this);
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

    handleEditorInput(event){
        this.setState({notes: event});
        this.validateInput(this.state.score, event);
    }

    validateInput(score, notes){
        if (this.state.notes.replace(/<\/?[^>]+(>|$)/g, '') == '' && score != 0) {
            this.props.updateNotesLeft(this.props.score.id, 'add');
        } else {
            this.props.updateNotesLeft(this.props.score.id, 'clear');
        }
    }

    selectEndpoint(endpoint){
		console.log('selected:'+endpoint+':'+this.state.endpointChoices[endpoint]);
		this.setState({
			endpointID: this.state.endpointChoices[endpoint],
			endpointText: this.state.endpointChoices[endpoint],
			numEndpointScores: this.state.numEndpointScores + 1,
		});
    }

    render() {
		const endpointScores = [];
		//const EPButton = this.props.showEPButton;
		
		for (var i=0;i<this.state.numEndpointScores; i++) {
			endpointScores.push(<EndpointScoreForm key={i} updateNotesLeft={this.props.updateNotesLeft} endpointID={this.state.endpointID} endpointText={this.state.endpointText} />);
		};
		
        let { name } = this.props.score.metric,
            { scoreChoices, score, notes, selectedSymbol, selectedShade, endpointChoices } = this.state;
	
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
					Select an endpoint<br/>to add unique notes:<br/>
                    <Select choices={endpointChoices} id={name+'_ep'} handleSelect={this.selectEndpoint} />
					<br/>
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
        }).isRequired,
    }).isRequired,
    updateNotesLeft: PropTypes.func.isRequired,
	showEPButton: PropTypes.bool,
};

export default ScoreForm;
