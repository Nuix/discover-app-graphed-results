
import jquery from 'jquery';
import 'jquery-ui/themes/base/all.css';
import 'jquery-ui/ui/widgets/autocomplete';
import 'jquery-ui.combobox';

import { renderGraph, updateSelection, handleResize } from './graph';

function GraphPanel(container, state) {
    state = state || {};

    this.container = container;
    this.parentEl = container.getElement();       // The container element to render the graph into
    this.graphData = null;          // Populated when results change via Ringtail API query
    this.chart = null;              // dcjs rendered chart

    this.activeField = state.activeField || 0;              // Field the user selected to graph coding for
    this.activeGraphType = state.activeGraphType || 'bar';  // Type of graph to draw

    this.parentEl.html('<div class="toolbar"></div><div class="graph"></div>');
    const toolbarEl = jquery('.toolbar', this.parentEl);
    toolbarEl.append(this.buildCombo(this.activeField, Data.fields, 'pick-field', this.handleFieldChange));
    toolbarEl.append(this.buildCombo(this.activeGraphType, [
        { id: 'bar', name: 'Column' },
        { id: 'row', name: 'Row' },
        { id: 'line', name: 'Line' },
        { id: 'pie', name: 'Pie' },
    ], 'pick-graph', this.handleGraphChange));

    this.loadData();
    this.container.on('resize', this.draw.bind(this))
}

GraphPanel.prototype.buildCombo = function buildCombo(value, choices, cls, callback) {
    const me = this;
    const el = jquery('\
    <select>\
        ' + choices.map(function (field) {
            return '<option value="' + field.id + '"' + (value === field.id ? ' selected' : '') + '>' + field.name + '</option>';
        }).join('\n') + '\
    </select>');
    el.combobox();
    el.on('change', function () {
        callback.call(me, this.value === '0' ? null : this.value);
        // jquery('.ui-helper-hidden-accessible').remove();
    });
    return el.next().addClass(cls);
}

GraphPanel.prototype.handleFieldChange = function handleFieldChange(value) {
    if (this.activeField !== value) {
        this.activeField = value;
        this.container.extendState({ activeField: value });
        this.loadData();
    }
};

GraphPanel.prototype.handleGraphChange = function handleGraphChange(value) {
    if (this.activeGraphType !== value) {
        this.activeGraphType = value;
        this.container.extendState({ activeGraphType: value });
        this.loadData();
    }
};

GraphPanel.prototype.loadData = function loadData() {
    const me = this;
    const canLoadData = Ringtail.Context.hostLocation !== 'Workspace'
        || Ringtail.ActiveDocument.get().searchResultId;

    me.container.setTitle(Data.fields.reduce(function (name, field) {
        return name || (field.id === me.activeField ? field.name : null);
    }, null));

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
    if (this.graphData) {
        renderGraph.call(this);
    }
};

GraphPanel.prototype.select = function select(selection) {
    if (this.graphData && selection.fieldId === this.activeField) {
        updateSelection.call(this, selection.values);
    }
};

GraphPanel.prototype.setPrintMode = function setPrintMode(printing) {
    if (this.graphData) {
        handleResize.call(this, printing);
    }
};

export default GraphPanel;