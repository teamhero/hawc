import React, { Component, PropTypes } from 'react';
import _ from 'underscore';

import UserAutocomplete from 'mgmt/ERTaskTable/components/UserAutocomplete';
import StatusSelection from 'mgmt/ERTaskTable/components/StatusSelection';
import ReactDatePicker from 'shared/components/ReactDatePicker';


class TaskForm extends Component {

    constructor(props) {
        super(props);
        const { owner, status, due_date, id } = props.ertask;
        this.state = {
            id,
            owner,
            status,
            due_date,
        };

        this.formDidChange = this.formDidChange.bind(this);
        this.getOwnerUpdate = this.getOwnerUpdate.bind(this);
        this.getStatusUpdate = this.getStatusUpdate.bind(this);
        this.getDueDateUpdate = this.getDueDateUpdate.bind(this);
    }

    formDidChange() {
        const { owner, status, due_date, id } = this.props.ertask;
        return !_.isEqual(
            this.state,
            { owner, status, due_date, id }
        );
    }

    getOwnerUpdate(owner) {
        this.setState({
            owner: {
                id: owner.id,
                full_name: owner.value,
            },
        });
    }

    getStatusUpdate(status) {
        this.setState({
            status,
        });
    }

    getDueDateUpdate(due_date) {
        this.setState({
            due_date,
        });
    }

    render() {
        const { ertask, className, autocompleteUrl } = this.props;
        return (
            <div className={className}>
                <UserAutocomplete onChange={this.getOwnerUpdate} task={ertask} url={autocompleteUrl} />
                <StatusSelection onChange={this.getStatusUpdate} task={ertask} />
                <ReactDatePicker onChange={this.getDueDateUpdate} labelClassName="control-label" label='Due date (optional)' id={`${ertask.id}-due_date`} date={ertask.due_date} />
            </div>
        );
    }
}

TaskForm.propTypes = {
    ertask: PropTypes.shape({
        due_date: PropTypes.string,
        id: PropTypes.number.isRequired,
        status: PropTypes.number.isRequired,
        status_display: PropTypes.string.isRequired,
        endpoint: PropTypes.shape({
            animal_group: PropTypes.shape({
                experiment: PropTypes.shape({
                    study: PropTypes.shape({
                        assessment: PropTypes.number.isRequired,
                    }).isRequired,
                }).isRequired,
            }).isRequired,
       }).isRequired,
    }).isRequired,
    className: PropTypes.string,
    autocompleteUrl: PropTypes.string.isRequired,
};

export default TaskForm;
