import React, { Component, PropTypes } from 'react';
import ReactQuill from 'react-quill';

import ScoreIcon from 'robTable/components/ScoreIcon';
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
                2: 'Deficient',
                3: 'Adequate',
                4: 'Good',
                10: 'Not reported',
            },
            score: null,
            notes: props.score.notes,
            choices: props.score.metric.answers.choice,
            symbols: props.score.metric.answers.symbol,
            shades: props.score.metric.answers.shade,
            answers: [],
        };
        this.handleEditorInput = this.handleEditorInput.bind(this);
        this.selectScore = this.selectScore.bind(this);
    }

    /*componentDidMount() {
        var that = this;
        fetch('http://localhost:8000/study/api/study/100000385', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        }).then(function(response) {
            return response.json();
        }).then(function(json) {
            console.log(json);
            that.setState({answers: json });
        });
    }*/

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

    render() {
        let { name } = this.props.score.metric,
            { scoreChoices, score, notes, selectedSymbol, selectedShade } = this.state;
        /*let  answers  = this.state.metricAnswers.map((answer) => {
            return (
                <option key={answer.answer_score}>{answer.choice}</option> 
            )
        });
        if (name === answers.metric) {
            return (
                <div className='score-form'>
                    <div>
                        <select>
                            {answers}
                        </select>
                        <br/><br/>
                        <ScoreIcon shade={answers.shade}
                                symbol={answers.symbol}/>
                    </div>
                    <ReactQuill id={name}
                            value={notes}
                            onChange={this.handleEditorInput}
                            toolbar={false}
                            theme='snow'
                            className='score-editor' />
                </div>
            );
        }*/
        /*if (this.state.answers !== undefined && this.state.answers.length > 0) {
            return (
                <div className='score-form'>
                    <div>
                        <select>
                            [this.state.answers]
                        </select>
                        <br/><br/>
                    </div>
                </div>
            );
        }*/
        return (
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
                         className='score-editor' />
            </div>
        );
    }
}

ScoreForm.propTypes = {
    score: PropTypes.shape({
        score: PropTypes.number.isRequired,
        notes: PropTypes.string.isRequired,
        metric: PropTypes.shape({
            name: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
    updateNotesLeft: PropTypes.func.isRequired,
};

export default ScoreForm;
