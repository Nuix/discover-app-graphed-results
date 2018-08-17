
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
            ' + buildCombo('Bar', [
                { id: 'bar', name: 'Bar' },
                { id: 'line', name: 'Line' },
                { id: 'pie', name: 'Pie' },
            ], 'graph') + '\
            ' + buildCombo('Y-Axis Counts', [
                { id: 'y', name: 'Y-Axis Counts' },
                { id: 'x', name: 'X-Axis Counts' },
            ], 'axis') + '\
        </div>\
        <div class="graph"></div>\
    </div>';
}

function newId(prefix) {
    return prefix + '-' + Math.random().toString(36).substring(2);
}

function buildCombo(value, choices, cls, placeholder) {
    var listId = newId('list');
    return '\
    <input class="select ' + cls + '" type="text" list="' + listId + '" value="' + value + '" placeholder="' + (placeholder || '') + '" />\
    <datalist id="' + listId + '">\
        ' + choices.map(function (field) { return '<option value="' + field.name + '" />'; }).join('\n') + '\
    </datalist>';
}

// GraphPanel.prototype.

export default GraphPanel;