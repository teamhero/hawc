import React, { Component, PropTypes } from 'react';

import StudyLabel from 'mgmt/ERTaskTable/components/StudyLabel';
import ExperimentLabel from 'mgmt/ERTaskTable/components/ExperimentLabel';
import AnimalGroupLabel from 'mgmt/ERTaskTable/components/AnimalGroupLabel';
import EndpointLabel from 'mgmt/ERTaskTable/components/EndpointLabel';
import TaskLabel from 'mgmt/ERTaskTable/components/TaskLabel';
import TaskToggle from 'mgmt/ERTaskTable/containers/TaskToggle';


class ERTask extends Component {

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
                        <TaskToggle TaskLabel={TaskLabel} key={ertask.id} ertask={ertask} className={`task-${index} flex-1`}/>
                    ))}
                </div>
            </div>
        );
    }
}

ERTask.propTypes = {
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
};

export default ERTask;
