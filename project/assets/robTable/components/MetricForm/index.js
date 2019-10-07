import React, { Component, PropTypes } from 'react';
import _ from 'underscore';

import ScoreDisplay from 'robTable/components/ScoreDisplay';
import ScoreForm from 'robTable/components/ScoreForm';
import './MetricForm.css';


class MetricForm extends Component {

    constructor(props) {
        super(props);
        this.state = {addText: ''};
        this.copyNotes = this.copyNotes.bind(this);
    }

    copyNotes(text){
        this.setState({addText: text});
    }

    renderScoreRow(){
        let { metric, config } = this.props,
            displayScores = _.filter(metric.values, (score) => {return !score.final;});

        return (
            <div className='score-row'>
            {_.map(displayScores, (score) => {
                return <ScoreDisplay key={score.id}
                            score={score}
                            config={config}
                            copyNotes={config.display ==='final' ? this.copyNotes : undefined} />;
            })}
            </div>
        );
    }

    render(){
        let { metric, config, updateNotesLeft } = this.props,
            formScore = _.findWhere(metric.values, {riskofbias_id: parseInt(config.riskofbias.id)});

        return (
            <div className='metric-display'>
                <h4>{metric.key}</h4>
                <span dangerouslySetInnerHTML={{
                    __html: metric.values[0].metric.description,
                }} />
                {config.display ==='final' ? this.renderScoreRow() : null}
                <ScoreForm ref='form' score={formScore} addText={this.state.addText} updateNotesLeft={updateNotesLeft}/>
            </div>
        );
    }
}

MetricForm.propTypes = {
    metric: PropTypes.shape({
        key: PropTypes.string.isRequired,
        values: PropTypes.arrayOf(
            PropTypes.shape({
                metric: PropTypes.shape({
                    description: PropTypes.string.isRequired,
                    name: PropTypes.string.isRequired,
                    answers: PropTypes.array,
                }).isRequired,
                notes: PropTypes.string.isRequired,
                score_description: PropTypes.string,
                score_symbol: PropTypes.string.isRequired,
                score_shade: PropTypes.string.isRequired,
            }).isRequired
        ).isRequired,
    }).isRequired,
    config: PropTypes.object,
    updateNotesLeft: PropTypes.func.isRequired,
};

export default MetricForm;
