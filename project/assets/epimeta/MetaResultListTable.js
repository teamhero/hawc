import BaseTable from 'utils/BaseTable';


class MetaResultListTable {

    constructor(endpoints) {
        this.endpoints = endpoints;
        this.table = new BaseTable();
    }

    buildTable() {
        if (this.endpoints.length === 0) {
            return '<p>No results available.</p>';
        }

        var x, table = this.table,
            headerTexts = [
			    {text:'Study',link:'protocol__study__short_citation'},
	            {text:'Meta result',link:'label'},
                {text:'Protocol',link:'protocol__name'},
                {text:'Health outcome',link:'health_outcome'},
                {text:'Exposure',link:'exposure'},
                {text:'Confidence interval',link:'lower_ci'},
                {text:'Estimate',link:'estimate'},
            ],
			headers = [];
		for (x in headerTexts) 
		    headers.push($('<a href="'+location.origin+location.pathname+'?order_by={0}">'.printf(headerTexts[x].link)).html(headerTexts[x].text));
        headers.pop();

        table.setColGroup([10, 16, 19, 12, 11, 10, 10]);
        table.addHeaderRow(headers);
        this.endpoints.map((endpoint) => {
            table.addRow(endpoint.buildListRow());
        });
        return table.getTbl();
    }
}

export default MetaResultListTable;