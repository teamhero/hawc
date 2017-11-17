import React, { Component, PropTypes } from 'react';
import _ from 'underscore';

import StudyLabel from 'mgmt/ERTaskTable/components/StudyLabel';
import ExperimentLabel from 'mgmt/ERTaskTable/components/ExperimentLabel';
import AnimalGroupLabel from 'mgmt/ERTaskTable/components/AnimalGroupLabel';
import EndpointLabel from 'mgmt/ERTaskTable/components/EndpointLabel';
import TaskForm from 'mgmt/ERTaskTable/components/TaskForm';


class ERTaskEdit extends Component {

    constructor(props) {
        super(props);
        this.getChangedData = this.getChangedData.bind(this);
    }

    getChangedData() {
        return _.chain(this.refs)
                .filter((ref) => { return ref.formDidChange(); })
                .map((ref) => { return ref.state; })
                .value();
    }

    render() {
        const { ertasks, endpoint } = this.props.item;
        return (
            <div>
                <hr className='hr-tight' />
                <div className='flexRow-container taskEndpoint'>
                    <StudyLabel study={endpoint.animal_group.experiment.study} />
                    <ExperimentLabel experiment={endpoint.animal_group.experiment} />
                    <AnimalGroupLabel animalGroup={endpoint.animal_group} />
                    <EndpointLabel endpoint={endpoint} />
                    {ertasks.map((ertask, index) => (
                        <TaskForm
                            key={ertask.id}
                            ref={`form-${index}`}
                            ertask={ertask}
                            className={`task-${index} flex-1`}
                            autocompleteUrl={this.props.autocompleteUrl}/>
                    ))}
                </div>
            </div>
        );
    }
}

ERTaskEdit.propTypes = {
    item: PropTypes.shape({
        endpoint: PropTypes.shape({
            name: PropTypes.string.isRequired,
        }).isRequired,
        ertasks: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.number.isRequired,
                owner: PropTypes.object,
                status: PropTypes.number.isRequired,
                status_display: PropTypes.string.isRequired,
            })
        ).isRequired,
    }),
    autocompleteUrl: PropTypes.string.isRequired,
};

export default ERTaskEdit;
