import React, { Component, PropTypes } from 'react';
import moment from 'moment';


class ExperimentLabel extends Component {
    render() {
        return (
            <div className='experiment-label flex-1'>
                <a href={this.props.experiment.url}>{this.props.experiment.name}</a>
            </div>
        );
    }
}

ExperimentLabel.propTypes = {
    experiment: PropTypes.shape({
        name: PropTypes.string.isRequired,
        id: PropTypes.number.isRequired,
        url: PropTypes.string.isRequired,
    }).isRequired,
};

export default ExperimentLabel;
