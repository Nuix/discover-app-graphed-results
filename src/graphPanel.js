
import jquery from 'jquery';
import 'jquery-ui/themes/base/all.css';
import 'jquery-ui/ui/widgets/autocomplete';
import 'jquery-ui.combobox';

import { renderGraph, updateSelection } from './graph';

function GraphPanel(parentEl, state) {
    state = state || {};

    this.parentEl = parentEl;       // The container element to render the graph into
    this.graphData = null;                                  // Populated when results change via Ringtail API query
    this.chart = null;                                      // dcjs rendered chart

    this.activeField = state.activeField || 0;           // Field the user selected to graph coding for
    this.activeGraphType = state.activeGraphType || 'bar';  // Type of graph to draw
    this.activeCountAxis = state.activeCountAxis || 'y';    // Which axis of the graph shows coding counts

    this.parentEl.html('<div class="toolbar"></div><div class="graph"></div>');
    const toolbarEl = jquery('.toolbar', this.parentEl);
    toolbarEl.append(buildCombo(this.activeField, Data.fields, 'pick-field'));
    toolbarEl.append(buildCombo(this.activeGraphType, [
        { id: 'bar', name: 'Bar' },
        { id: 'line', name: 'Line' },
        { id: 'pie', name: 'Pie' },
    ], 'pick-graph'));
    toolbarEl.append(buildCombo(this.activeCountAxis, [
        { id: 'y', name: 'Y-Axis Counts' },
        { id: 'x', name: 'X-Axis Counts' },
    ], 'pick-axis'));
}

function buildCombo(value, choices, cls) {
    var el = jquery('\
    <select value="' + value + '">\
        ' + choices.map(function (field) { return '<option value="' + field.id + '">' + field.name + '</option>'; }).join('\n') + '\
    </select>');
    el.combobox();
    return el.next().addClass(cls);
}

GraphPanel.prototype.loadData = function loadData() {
    const me = this;
    const canLoadData = Ringtail.Context.hostLocation !== 'Workspace'
        || Ringtail.ActiveDocument.get().searchResultId;

    // Skip out if we don't have everything we need to load up yet
    if (!canLoadData || !me.activeField) {
        return;
    }

    // Keep track of the current result set ID so we can detect changes
    this.searchResultId = Ringtail.ActiveDocument.get().searchResultId;
    Ringtail.setLoading(true);

    // Request coding count aggregates for the active result set and selected field
    // from Ringtail via GraphQL
    Ringtail.query(' \
    query ($caseId: Int!, $searchResultId: Int!, $fieldId: String!) { \
        cases (id: $caseId) { \
            searchResults (id: $searchResultId) { \
                fields (id: [$fieldId]) { \
                    items { \
                        id \
                        name \
                        count \
                    } \
                } \
            } \
        } \
    }', { 
        caseId: Ringtail.Context.caseId,
        searchResultId: me.searchResultId,
        fieldId: me.activeField
    }).then(function (response) {
        me.graphData = response.data.cases[0].searchResults[0].fields[0].items;
        me.draw();
    });
};

GraphPanel.prototype.draw = function draw() {
    renderGraph.apply(this);
};

export default GraphPanel;