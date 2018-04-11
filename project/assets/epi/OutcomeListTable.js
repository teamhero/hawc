import $ from '$';
import BaseTable from 'utils/BaseTable';

class OutcomeListTable {

    constructor(outcomes) {
        this.outcomes = outcomes;
        this.table = new BaseTable();
    }

    buildTable() {
        if (this.outcomes.length === 0) {
            return '<p>No endpoints available.</p>';
        }

        var x, table = this.table,
            headerTexts = [
			    {text:'Study',link:'study_population__study__short_citation'},
	            {text:'Study population',link:'study_population__name'},
                {text:'Outcome',link:'name'},
                {text:'System',link:'system'},
                {text:'Effect',link:'effect'},
                {text:'Diagnostic',link:'diagnostic'}
            ],
			headers = [];
		for (x in headerTexts) 
		    headers.push($('<a href="'+location.origin+location.pathname+'?order_by={0}">'.printf(headerTexts[x].link)).html(headerTexts[x].text));
        headers.pop();
		table.setColGroup([12, 25, 16, 17, 10, 13]);
        table.addHeaderRow(headers);
        this.outcomes.map((outcome) => {
            table.addRow(outcome.buildListRow());
        });
        return table.getTbl();
    }
}

export default OutcomeListTable;