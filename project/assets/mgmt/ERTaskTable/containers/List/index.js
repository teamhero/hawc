import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'underscore';

import { fetchERTasks, fetchEndpoints, filterAndSortEndpoints, submitTasks } from 'mgmt/ERTaskTable/actions';

import CancelButton from 'mgmt/ERTaskTable/components/CancelButton';
import EmptyListNotification from 'shared/components/EmptyListNotification';
import Header from 'mgmt/ERTaskTable/components/Header';
import List from 'mgmt/ERTaskTable/components/List';
import Loading from 'shared/components/Loading';
import ScrollToErrorBox from 'shared/components/ScrollToErrorBox';
import SubmitButton from 'mgmt/ERTaskTable/components/SubmitButton';
import EndpointFilter from 'mgmt/ERTaskTable/components/EndpointFilter';
import ERTask from 'mgmt/ERTaskTable/components/ERTask';
import ERTaskEdit from 'mgmt/ERTaskTable/components/ERTaskEdit';
import './List.css';


class ListApp extends Component {

    constructor(props) {
        super(props);
        this.handleCancel = this.handleCancel.bind(this);
        this.filterEndpoints = this.filterEndpoints.bind(this);
        this.updateForm = this.updateForm.bind(this);
    }

    componentWillMount() {
        this.props.dispatch(fetchERTasks());
        this.props.dispatch(fetchEndpoints());
    }

    filterEndpoints(opts) {
        this.props.dispatch(filterAndSortEndpoints(opts));
    }

    formatERTasks() {
        const { ertasks, endpoints } = this.props,
            ertaskList = endpoints.visibleList.map((endpoint) => {
                let formattedERTasks = ertasks.list.filter((ertask) => {
                    return ertask.endpoint.id === endpoint.id;
                }).sort((a, b) => (a.type - b.type));

                return {ertasks: formattedERTasks , endpoint};
            });
        return ertaskList;
    }

    handleCancel() {
        window.location.href = this.props.config.cancelUrl;
    }

    updateForm(e) {
        e.preventDefault();
        const updatedData = _.chain(this.refs.list.refs)
                    .map((ref) => { return ref.getChangedData(); })
                    .filter((data) => { return !_.isEmpty(data); })
                    .flatten()
                    .value();
        this.props.dispatch(submitERTasks(updatedData));
    }

    render() {
        if (!this.props.ertasks.isLoaded) return <Loading />;
        const { error, config } = this.props,
            ertaskList = this.formatERTasks(),
            emptyERTaskList = (ertaskList.length === 0),
            headings = ['Risk of Bias Completed'],
            descriptions = ['Risk of bias has been completed for this reference (if enabled for this assessment).'],
            displayForm = config.type === 'edit';

        return (
                <div>
                    <ScrollToErrorBox error={error} />
                    <EndpointFilter selectFilter={this.filterEndpoints}/>
                    <Header headings={headings} descriptions={descriptions} />
                    {emptyERTaskList ?
                        <EmptyListNotification listItem={'endpoints'} /> :
                        <List component={displayForm ? ERTaskEdit : ERTask} items={ertaskList} autocompleteUrl={this.props.config.autocomplete.url} ref='list' />}
                    {displayForm ? <SubmitButton submitForm={this.updateForm} /> : null}
                    {displayForm ? <CancelButton onCancel={this.handleCancel} /> : null}
                </div>
        );
    }
}

function mapStateToProps(state){
    const { error, ertasks, endpoints, config } = state;
    return {
        config,
        error,
        ertasks,
        endpoints,
    };
}

export default connect(mapStateToProps)(ListApp);
