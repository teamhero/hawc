import React, { Component, PropTypes } from 'react';

import StudyTypeSelector from 'mgmt/ERTaskTable/components/StudyTypeSelector';
import ExperimentSelector from 'mgmt/ERTaskTable/components/ExperimentSelector';
import AnimalGroupSelector from 'mgmt/ERTaskTable/components/AnimalGroupSelector';
import EndpointTypeSelector from 'mgmt/ERTaskTable/components/EndpointTypeSelector';
import EndpointSortSelector from 'mgmt/ERTaskTable/components/EndpointSortSelector';


class EndpointFilter extends Component {

    constructor(props) {
        super(props);
        let fieldOptions = ['name'],
            orderOptions = ['ascending', 'descending'];
        this.state = {
            endpointTypes: [],
            endpointSorting: {
                field: fieldOptions[0],
                order: orderOptions[0],
            },
            fieldOptions,
            orderOptions,
        };
        this.clearFilters = this.clearFilters.bind(this);
        this.filterResults = this.filterResults.bind(this);
        this.selectEndpointType = this.selectEndpointType.bind(this);
        this.selectSort = this.selectSort.bind(this);
    }

    clearFilters() {
        const defaults = {
            endpointTypes: [],
            endpointSorting: {
                field: this.state.fieldOptions[0],
                order: this.state.orderOptions[0],
            },
        };
        this.setState({...defaults});
        this.props.selectFilter({
            filterOpts: defaults.endpointTypes,
            sortOpts: defaults.endpointSorting,
        });
    }

    filterResults() {
        this.props.selectFilter({
            filterOpts: this.state.endpointTypes,
            sortOpts: this.state.endpointSorting,
        });
    }

    selectStudyType(types) {
        this.setState({
            endpointTypes: types,
        });
    }

    selectExperiment(types) {
        this.setState({
            endpointTypes: types,
        });
    }

    selectAnimalGroup(types) {
        this.setState({
            endpointTypes: types,
        });
    }

    selectEndpointType(types) {
        this.setState({
            endpointTypes: types,
        });
    }

    selectSort(opts) {
        this.setState({
            endpointSorting: opts,
        });
    }

    render() {
        return (
            <div className='container-fluid filterContainer'>
                <div className='flexRow-container'>
                    <StudyTypeSelector
                        className='flex-1'
                        handleChange={this.selectStudyType}/>
                    <ExperimentSelector
                        className='flex-1'
                        handleChange={this.selectExperiment}/>
                    <AnimalGroupSelector
                        className='flex-1'
                        handleChange={this.selectAnimalGroup}/>
                    <EndpointTypeSelector
                        className='flex-1'
                        handleChange={this.selectEndpointType}/>
                    <EndpointSortSelector
                        className='flex-1'
                        handleChange={this.selectSort}
                        fieldOptions={this.state.fieldOptions}
                        orderOptions={this.state.orderOptions}
                        endpointSorting={this.state.endpointSorting}/>
                </div>
                <button className='btn btn-primary' onClick={this.filterResults}>Filter & sort endpoints</button>
                <span>&nbsp;</span>
                <button className='btn btn-secondary' onClick={this.clearFilters}>Reset</button>
            </div>
        );
    }
}

EndpointFilter.propTypes = {
    selectFilter: PropTypes.func.isRequired,
};

export default EndpointFilter;
