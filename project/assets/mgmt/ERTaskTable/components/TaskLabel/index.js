import React, { Component, PropTypes } from 'react';

import DueDateLabel from 'mgmt/ERTaskTable/components/DueDateLabel';
import StatusLabel from 'mgmt/ERTaskTable/components/StatusLabel';
import './TaskLabel.css';


class TaskLabel extends Component {

    renderOwner(ertask){
        if (!ertask.owner){
            return null;
        }
        return <div><b>Owner: </b>{ertask.owner.full_name}</div>;
    }

    render() {
        const { ertask } = this.props;
        return (
            <div className='taskLabel'>
                <StatusLabel ertask={ertask} />
                {this.renderOwner(ertask)}
                <DueDateLabel status={ertask.status} due_date={ertask.due_date} />
            </div>
        );
    }
}

TaskLabel.propTypes = {
    ertask: PropTypes.shape({
        owner: PropTypes.object,
        status: PropTypes.number.isRequired,
        status_display: PropTypes.string.isRequired,
        due_date: PropTypes.string,
    }).isRequired,
};

export default TaskLabel;
