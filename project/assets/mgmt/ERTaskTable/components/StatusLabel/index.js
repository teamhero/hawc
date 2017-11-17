import React, { PropTypes } from 'react';

import h from 'mgmt/utils/helpers';
import StatusIcon from 'mgmt/ERTaskTable/components/StatusIcon';


const StatusLabel = (props) => {
    return (
        <div>
            <b>Status: </b>
            <StatusIcon status={props.ertask.status} />
            {h.caseToWords(props.ertask.status_display)}
        </div>
    );
};

StatusLabel.propTypes = {
    ertask: PropTypes.shape({
        status: PropTypes.number.isRequired,
        status_display: PropTypes.string.isRequired,
    }).isRequired,
};

export default StatusLabel;
