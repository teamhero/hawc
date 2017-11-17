import React, { Component, PropTypes } from 'react';

import h from 'mgmt/utils/helpers';


class EndpointSortSelector extends Component {

    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.state = props.endpointSorting;
        this.defaults = {
            order: props.orderOptions[0],
            field: props.fieldOptions[0],
        };
    }

    onChange({ currentTarget }) {
        const { name, id } = currentTarget,
            { field, order } = this.state;
        this.props.handleChange({
            order: order ? order : this.defaults.order,
            field: field ? field : this.defaults.field,
            [name]: id,
        });
        this.setState({ [name]: id });
    }

    render() {
        const { className, fieldOptions, orderOptions, endpointSorting } = this.props;
        return (
            <div className={className}>
                <div className='flexRow-container'>

                    <div className='flex-1'>
                        <label className='control-label' htmlFor='endpoint_sorting-field'>Sort endpoints by:</label>
                        <form id='endpoint_sorting-field'>
                        {fieldOptions.map((field) => {
                            return (
                                <label key={field} htmlFor={field}>
                                    <input onChange={this.onChange} checked={endpointSorting.field == field} type='radio' id={field} name='field' style={{margin: '0 4px'}}/>
                                    {h.caseToWords(field)}
                                </label>);
                        })}
                        </form>
                    </div>

                    <div className='flex-1'>
                        <label className='control-label' htmlFor="endpoint_sorting-order">Order endpoints by:</label>
                        <form id='endpoint_sorting-order'>
                        {orderOptions.map((order) => {
                            return (
                                <label key={order} htmlFor={order}>
                                    <input onChange={this.onChange} checked={endpointSorting.order === order} type='radio' id={order} name='order' style={{margin: '0 4px'}}/>
                                    {h.caseToWords(order)}
                                </label>);
                        })}
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

EndpointSortSelector.propTypes = {
    handleChange: PropTypes.func.isRequired,
    endpointSorting: PropTypes.shape({
        field: PropTypes.string,
        order: PropTypes.string,
    }).isRequired,
    fieldOptions: PropTypes.array.isRequired,
    orderOptions: PropTypes.array.isRequired,
};

export default EndpointSortSelector;
