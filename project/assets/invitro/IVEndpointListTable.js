import BaseTable from 'utils/BaseTable';


class IVEndpointListTable {

    constructor(endpoints) {
        this.endpoints = endpoints;
        this.table = new BaseTable();
    }

    buildTable() {
        if (this.endpoints.length === 0) {
            return '<p>No endpoints available.</p>';
        }

        var x, table = this.table,
            headerTexts = [
			    {text:'Study',link:'experiment__study__short_citation'},
	            {text:'Experiment',link:'experiment__name'},
                {text:'Chemical',link:'chemical__name'},
                {text:'Endpoint',link:'name'},
                {text:'Effect Category',link:'category__name'},
                {text:'Effects',link:'effect'},
                {text:'Dose Units',link:'experiment__dose_units'},
                {text:'Response Units',link:'response_units'},
            ],
			headers = [];
		for (x in headerTexts) 
		    headers.push($('<a href="'+location.origin+location.pathname+'?order_by={0}">'.printf(headerTexts[x].link)).html(headerTexts[x].text));
        headers.pop();
			
        table.setColGroup([10, 16, 12, 11, 16, 20, 7, 7]);
        table.addHeaderRow(headers);
        this.endpoints.map((endpoint) => {
            table.addRow(endpoint.buildListRow());
        });
        return table.getTbl();
    }
}

export default IVEndpointListTable;