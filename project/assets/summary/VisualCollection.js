import $ from '$';
import _ from 'underscore';

import Tablesort from 'tablesort';

import BaseTable from 'utils/BaseTable';
import HAWCUtils from 'utils/HAWCUtils';

import BaseVisual from './BaseVisual';


const NULL_FILTER = '---';

class VisualCollection {

    constructor(data){
        this.visuals = [];
        for(var i=0; i<data.length; i++){
            this.visuals.push(new BaseVisual(data[i]));
        }
    }

    // This method builds the HTML table of links to this assessment's visualizations
    static buildTable(url1, url2, url3, $el) {
        var visuals, obj;

        // Call the included API URLs to retrieve the information about each type of visualization
        $.when(
           $.get(url1),
           $.get(url2),
           $.get(url3)
        ).done(
            function(d1, d2, d3) {
                // Merge all three of the responses into a single array
                d1[0].push.apply(d1[0], d2[0]);
                d1[0].push.apply(d1[0], d3[0]);

                // Sort the data returned by title
                visuals = _.sortBy(
                    d1[0],
                    function(d) {
                        return d.title;
                    }
                );
            }
        ).fail(
            function() {
                // Something went wrong with at least one of the URLs, generate an alert
                HAWCUtils.addAlert('Error- unable to fetch visualizations; please contact a HAWC administrator.');
                visuals = [];
            }
        ).always(
            function() {
                // Whether everything went okay or not, build an HTML table based around the visuals array
                obj = new VisualCollection( visuals );
                return obj.build_table($el);
            }
        );
    }

    build_table($el){
        if(this.visuals.length === 0)
            return $el.html('<p><i>No custom-visuals are available for this assessment.</i></p>');

        var tbl = new BaseTable();
        tbl.addHeaderRow(['Title', 'Visual type', 'Description', 'Created', 'Modified']);
        tbl.setColGroup([20, 20, 38, 11, 11]);
        for(var i=0; i<this.visuals.length; i++){
            tbl.addRow(this.visuals[i].build_row());
        }
        $el
            .append(this.setTableFilter())
            .append(tbl.getTbl());
        this.$tbl = $($el.find('table'));
        this.setTableSorting(this.$tbl);
        return $el;
    }

    setTableSorting(){
        var name = this.$tbl.find('thead tr th')[0];
        name.setAttribute('class', (name.getAttribute('class') || '') + ' sort-default');
        new Tablesort(this.$tbl[0]);
    }

    setTableFilter(){
        var types = _.chain(this.visuals)
                .pluck('data')
                .pluck('visual_type')
                .sort()
                .uniq(true)
                .unshift(NULL_FILTER)
                .map((d) =>`<option value="${d}">${d}</option>`)
                .value();

        return $('<div>').append(
            '<label class="control-label">Filter by visualization type:</label>',
            $('<select>').append(types).change(this.filterRows.bind(this))
        );
    }

    filterRows(e){
        var filter = (e)? e.target.value: NULL_FILTER,
            isNullFilter = (filter === NULL_FILTER);

        this.$tbl.find('tbody tr').each(function(){
            if (isNullFilter || this.innerHTML.indexOf(filter)>=0){
                this.style.display = null;
            } else {
                this.style.display = 'none';
            }
        });
    }

}

export default VisualCollection;
