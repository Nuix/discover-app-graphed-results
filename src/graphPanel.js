
import jquery from 'jquery';
import 'jquery-ui/themes/base/all.css';
import 'jquery-ui/ui/widgets/autocomplete';
import 'jquery-ui.combobox';

// Our own dependencies
import { renderGraph, updateSelection } from './graph';

function GraphPanel(parentEl, state) {
    state = state || {};

    //'#graph'
    this.parentEl = document.querySelector(parentEl);       // The container element to render the graph into
    this.graphData = null;                                  // Populated when results change via Ringtail API query
    this.chart = null;                                      // dcjs rendered chart

    this.activeField = state.activeField || null;           // Field the user selected to graph coding for
    this.activeGraphType = state.activeGraphType || 'bar';  // Type of graph to draw
    this.activeCountAxis = state.activeCountAxis || 'y';    // Which axis of the graph shows coding counts

    this.parentEl.innerHTML = '\
    <div class="graph-panel">\
        <div class="toolbar">\
            ' + buildCombo('', Data.fields, 'field', 'Select a field') + '\
            ' + buildCombo('bar', [
                { id: 'bar', name: 'Bar' },
                { id: 'line', name: 'Line' },
                { id: 'pie', name: 'Pie' },
            ], 'graph') + '\
            ' + buildCombo('y', [
                { id: 'y', name: 'Y-Axis Counts' },
                { id: 'x', name: 'X-Axis Counts' },
            ], 'axis') + '\
            <div class="fill"> </div>\
        </div>\
        <div class="graph"></div>\
    </div>';
    jquery('select', this.parentEl).combobox();
}

function newId(prefix) {
    return prefix + '-' + Math.random().toString(36).substring(2);
}

function buildCombo(value, choices, cls, placeholder) {
    return '\
    <select class="' + cls + '" value="' + value + '" placeholder="' + (placeholder || '') + '">\
        ' + choices.map(function (field) { return '<option value="' + field.id + '">' + field.name + '</option>'; }).join('\n') + '\
    </select>';
}

// GraphPanel.prototype.

export default GraphPanel;