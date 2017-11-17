import React, { Component, PropTypes } from 'react';
import moment from 'moment';


class EndpointLabel extends Component {
    render() {
        return (
            <div className='endpoint-label flex-1'>
                <a href={this.props.endpoint.url}>{this.props.endpoint.name}</a>
            </div>
        );
    }
}

EndpointLabel.propTypes = {
    endpoint: PropTypes.shape({
        name: PropTypes.string.isRequired,
        id: PropTypes.number.isRequired,
        url: PropTypes.string.isRequired,
    }).isRequired,
};

export default EndpointLabel;
