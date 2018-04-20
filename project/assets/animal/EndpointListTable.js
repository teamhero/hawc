import _ from 'underscore';

import BaseTable from 'utils/BaseTable';


class EndpointListTable {
    constructor(endpoints, dose_id){
        if(dose_id) _.each(endpoints, function(e){e.switch_dose_units(dose_id);});
        this.endpoints = endpoints;
        this.tbl = new BaseTable();
    }

    build_table(){
        if(this.endpoints.length === 0)
            return '<p>No endpoints available.</p>';
        var x, tbl = this.tbl,
            headerTexts = [
			    {text:'Study',link:'animal_group__experiment__study__short_citation'},
	            {text:'Experiment',link:'animal_group__experiment__name'},
                {text:'Animal group',link:'animal_group__name'},
                {text:'Endpoint',link:'name'},
                {text:'Units',link:'response_units'},
                {text:'NOEL',link:'-NOEL'},
                {text:'LOEL',link:'-LOEL'},
            ],
			headers = [];
		for (x in headerTexts) 
		    headers.push($('<a href="'+location.origin+location.pathname+'?order_by={0}">'.printf(headerTexts[x].link)).html(headerTexts[x].text));
        headers.pop();

        tbl.setColGroup([12, 16, 17, 31, 10, 7, 7]);
        tbl.addHeaderRow(headers);
        this.endpoints.forEach(function(v){
            tbl.addRow(v.build_endpoint_list_row());
        });
        return tbl.getTbl();
    }
}

export default EndpointListTable;
