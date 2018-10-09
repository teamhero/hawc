import React, { Component, PropTypes } from 'react';

import MetricDisplay from 'robTable/components/MetricDisplay';
import MetricForm from 'robTable/components/MetricForm';


class DomainDisplay extends Component {

    constructor(props){
        super(props);
		this.endpoints = [];
		if (this.props.endpoints.length > 0) {
            for (var i=0; i < this.props.endpoints.length; i++) { 
			    for (var j=0; j < this.props.endpoints[i].animal_groups.length; j++) {
			        for (var k=0; k < this.props.endpoints[i].animal_groups[j].endpoints.length; k++) {
			            var choice = this.props.endpoints[i].animal_groups[j].name+":"+this.props.endpoints[i].animal_groups[j].endpoints[k].name;
                        var choiceId = this.props.endpoints[i].animal_groups[j].endpoints[k].id;
                        this.endpoints[choiceId] = choice;
					}
				}
            }
		}
		this.endpoints = this.endpoints.sort(SortByValue);
		this.endpoints = Object.assign({}, this.endpoints);
	}

    render(){
        let { domain, config, updateNotesLeft } = this.props;
        return (
            <div>
                <h3>{domain.key}</h3>
                {_.map(domain.values, (metric) => {
                    let props = {
                        key: metric.key,
                        ref: _.last(metric.values).id,
                        metric,
                        config};
                    return config.isForm ?
                        <MetricForm {...props} updateNotesLeft={updateNotesLeft} endpoints={this.endpoints} /> :
                        <MetricDisplay {...props} />;
                })}
                <hr/>
            </div>
        );
    }

}

    function SortByValue(x,y) {
        return ((x[1] == y[1]) ? 0 : ((x[1] > y[1]) ? 1 : -1 ));
    }

DomainDisplay.propTypes = {
    domain: PropTypes.shape({
        key: PropTypes.string.isRequired,
        values: PropTypes.array.isRequired,
    }).isRequired,
    config: PropTypes.object,
    updateNotesLeft: PropTypes.func,
};

export default DomainDisplay;
