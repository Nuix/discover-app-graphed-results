
import jquery from 'jquery';
import 'jquery-ui/themes/base/all.css';
import 'jquery-ui/ui/widgets/autocomplete';
import 'jquery-ui.combobox';

import { renderGraph, updateSelection, handleResize } from './graph';
import setLoading from './loadingMask';

function GraphPanel(container, state) {
    var me = this;
    state = state || {};

    this.container = container;             // Hosting GoldenLayout container
    this.parentEl = container.getElement(); // The container element to render the graph into
    this.graphData = null;                  // Populated when results change via Ringtail API query
    this.chart = null;                      // dcjs rendered chart
    this.loadOnNextShow = false;            // True when we missing a load while hidden

    this.activeField = state.activeField || 0;              // Field the user selected to graph coding for
    this.activeGraphType = state.activeGraphType || 'bar';  // Type of graph to draw

    this.parentEl.html('<div class="toolbar"></div><div class="graph"></div>');
    const toolbarEl = jquery('.toolbar', this.parentEl);
    toolbarEl.append(this.buildCombo(this.activeField, Data.fields, 'pick-field', this.handleFieldChange));
    toolbarEl.append(this.buildCombo(this.activeGraphType, [
        { id: 'bar', name: 'Column' },
        { id: 'row', name: 'Row' },
        { id: 'pie', name: 'Pie' },
    ], 'pick-graph', this.handleGraphChange));

    this.loadData();
    this.container.on('resize', this.draw.bind(this))
    this.container.on('show', function () {
        if (me.loadOnNextShow) {
            me.loadOnNextShow = false;
            setTimeout(me.loadData.bind(me));
        }
    });
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
    const isWorkspace = Ringtail.Context.hostLocation === 'Workspace';
    const canLoadData = !isWorkspace || Ringtail.ActiveDocument.get().searchResultId;

    const field = Data.fields.reduce(function (out, field) {
        return out || (field.id === me.activeField ? field : null);
    }, null);
    if (!field) {
        return me.handleFieldChange(null);
    }

    me.container.setTitle(field.name);

    // Skip out if we don't have everything we need to load up yet
    if (!canLoadData || !me.activeField) {
        return;
    }
    if (me.container.isHidden) {
        me.loadOnNextShow = true;;
        return;
    }

    // Keep track of the current result set ID so we can detect changes
    me.searchResultId = Ringtail.ActiveDocument.get().searchResultId;
    setLoading(me.parentEl, true);

    // Request coding count aggregates for the active result set and selected field
    // from Ringtail via GraphQL
    if (isWorkspace) {
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
    } else {
        me.graphData = Data.fields.reduce(function (items, field) {
            return items || (field.id === me.activeField ? field.items : null);
        }, null);
        me.draw();
    }
};

GraphPanel.prototype.draw = function draw() {
    if (this.graphData) {
        renderGraph.call(this);
        setLoading(this.parentEl, false);
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