import React, { Component, PropTypes } from 'react';

import MetricDisplay from 'robTable/components/MetricDisplay';
import MetricForm from 'robTable/components/MetricForm';


class DomainDisplay extends Component {

    constructor(props){
        super(props);
		this.endpoints = {};
		if (this.props.endpoints.length > 0) {
			this.endpoints[0] = "";
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
		this.endpointscores = _.flatten(_.map(this.props.scoresperendpoint, (spe) => {
			return {
				spe_id: spe.id,
				baseendpoint: spe.baseendpoint,
				notes: spe.notes,
				score: spe.state.score,
				metric_id: spe.metric.id };
        }));
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
						metric_id: metric.values[0].metric.id,
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

DomainDisplay.propTypes = {
    domain: PropTypes.shape({
        key: PropTypes.string.isRequired,
        values: PropTypes.array.isRequired,
    }).isRequired,
    config: PropTypes.object,
    updateNotesLeft: PropTypes.func,
};

export default DomainDisplay;
