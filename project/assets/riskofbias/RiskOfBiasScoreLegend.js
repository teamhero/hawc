import _ from 'underscore';
import d3 from 'd3';


class RiskOfBiasScore {

    constructor(study, data){
        this.study = study;
        this.data = data;
        this.data.metric.created = new Date(this.data.metric.created);
        this.data.metric.last_updated = new Date(this.data.metric.last_updated);
    }

    static format_for_react(robs, config){
        config = config || {display: 'final', isForm: false};
        var scores = _.map(robs, function(rob){
            if(!rob.data.author){ _.extend(rob.data, {author: {full_name: ''}});}
            return _.extend(
                rob.data, {
                    domain: rob.data.metric.domain.id,
                    domain_name: rob.data.metric.domain.name,
                    study: {
                        name: rob.study.data.short_citation,
                        url: rob.study.data.url,
                    },
                    final: true,
                });
        });

        return {
            domain: robs[0].data.metric.domain.name,
            metric: robs[0].data.metric,
            scores: d3.nest()
                      .key(function(d){return d.metric.domain.name;})
                      .key(function(d){return d.metric.name;})
                      .entries(scores),
            config,
        };
    }

}

_.extend(RiskOfBiasScore, {
    score_values: [4, 3, 2, 10, 1, 0],
    score_text: {
        4: '++',
        3: '+',
        2: '-',
        10: 'NR',
        1: '--',
        0: 'N/A',
    },
    score_shades: {
        4: '#00CC00',
        3: '#6FFF00',
        2: '#FFCC00',
        10: '#FFCC00',
        1: '#CC3333',
        0: '#E8E8E8',
    },
    score_text_description: {
        4: 'Good (metric) or High confidence (overall)',
        3: 'Adequate (metric) or Medium confidence (overall)',
        2: 'Deficient (metric) or Low confidence (overall)',
        10: 'Not reported for metric',
        1: 'Critically deficient (metric) or Uninformative (overall)',
        0: 'Not applicable',
    },
    collapsedNR: 'Probably high risk of bias/not reported',
});

export default RiskOfBiasScore;
