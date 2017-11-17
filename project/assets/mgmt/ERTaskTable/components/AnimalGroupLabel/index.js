import React, { Component, PropTypes } from 'react';
import moment from 'moment';


class AnimalGroupLabel extends Component {
    render() {
        return (
            <div className='animal-group-label flex-1'>
                <a href={this.props.animalGroup.url}>{this.props.animalGroup.name}</a>
            </div>
        );
    }
}

AnimalGroupLabel.propTypes = {
    animalGroup: PropTypes.shape({
        name: PropTypes.string.isRequired,
        id: PropTypes.number.isRequired,
        url: PropTypes.string.isRequired,
    }).isRequired,
};

export default AnimalGroupLabel;
