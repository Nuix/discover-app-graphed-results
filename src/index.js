'use strict';

// Promise polyfill for IE11
import 'promise-polyfill/src/polyfill';

// Provides Ringtail communication and utility APIs
import 'ringtail-extension-sdk';

// Our own dependencies
import 'dc/dc.css';


// Track our state here so we can differentiate it from local variables by namespace
const Data = {
    fields: null,       // Populated once on load via Ringtail API query
    graphData: null,    // Populated when the result set changes via Ringtail API query

    resultSetId: null,  // Updated via ActiveDocument event so we can detect changes

    // Field the user selected to graph coding for
    activeField: localStorage.getItem('GraphedResults.ActiveField') || null,
    // Type of graph to draw
    activeGraphType: localStorage.getItem('GraphedResults.ActiveGraphType') || 'bar',
    // Which axis of the graph shows coding counts
    activeCountAxis: localStorage.getItem('GraphedResults.ActiveCountAxis') || 'y'
};


function updateTools() {
    // Construct native Ringtail controls in the pane's toolbar to customize the graphs
    Ringtail.setTools([{
        type: 'combo',
        id: 'fieldPicker',
        placeholder: 'Select a field',
        width: 250,
        value: Data.activeField,
        choices: Data.fields.map(function (field) {
            return { id: field.id, name: field.name };
        })
    }, {
        type: 'combo',
        id: 'graphTypePicker',
        width: 80,
        value: Data.activeGraphType,
        choices: [
            { id: 'bar', name: 'Bar' },
            { id: 'line', name: 'Line' },
            { id: 'pie', name: 'Pie' },
        ]
    }, {
        type: 'combo',
        id: 'axisPicker',
        width: 130,
        value: Data.activeCountAxis,
        choices: [
            { id: 'y', name: 'Y-Axis Counts' },
            { id: 'x', name: 'X-Axis Counts' },
        ]
    }, {
        type: 'button',
        icon: 'icon-page-refresh',
        id: 'refreshButton',
        label: 'Reload'
    }, {
        type: 'button',
        icon: 'icon-print',
        id: 'printButton',
        label: 'Print'
    }]);
}

function loadData() {
    // Skip out if we don't have everything we need to load up yet
    if (!Ringtail.ActiveDocument.get().resultSetId || !Data.activeField) {
        return;
    }

    // Keep track of the current result set ID so we can detect changes
    Data.resultSetId = Ringtail.ActiveDocument.get().resultSetId;

    // Request coding count aggregates for the active result set and selected field
    // from Ringtail via GraphQL
    Ringtail.query(' \
    query ($caseId: Int!, $resultSetId: Int!, $fieldId: String!) { \
        cases (id: $caseId) { \
            searchResults (id: $resultSetId) { \
                fields (id: $fieldId) { \
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
        resultSetId: Data.resultSetId,
        fieldId: Data.activeField
    }).then(function (response) {
        Data.graphData = response.data.cases[0].searchResults[0].fields;

        // TODO: Draw the graph here now that we have the data
    });
}

function handleActiveDocChanged(msg) {
    if (msg.data.resultSetId !== Data.resultSetId) {
        // We only need to reload when the result set changes - ignore other changes!
        loadData();
    }
}

function handleFacetSelectionChanged(msg) {
    // TODO: Synchronize selection from Ringtail with the graph
}

function handleToolAction(msg) {
    switch (msg.data.id) {
        case 'fieldPicker':
            Data.activeField = msg.data.value;
            localStorage.setItem('GraphedResults.ActiveField', Data.activeField);
            loadData();
            break;
        case 'graphTypePicker':
            Data.activeGraphType = msg.data.value;
            localStorage.setItem('GraphedResults.ActiveGraphType', Data.activeGraphType);
            loadData();
            break;
        case 'axisPicker':
            Data.activeCountAxis = msg.data.value;
            localStorage.setItem('GraphedResults.ActiveCountAxis', Data.activeCountAxis);
            loadData();
            break;
        case 'printButton':
            window.print();
            break;
        case 'refreshButton':
            loadData();
            break;
    }
}

// Listen for these events from Ringtail
Ringtail.on('ActiveDocument', handleActiveDocChanged)
Ringtail.on('FacetSelection', handleFacetSelectionChanged);
Ringtail.on('ToolAction', handleToolAction);

// Register ourselves as a UIX with Ringtail and open communications
Ringtail.initialize().then(function () {
    // Request available coding fields for this user to display in a field picker
    // from Ringtail via GraphQL
    return Ringtail.query(' \
    query ($caseId: Int!) { \
        cases (id: $caseId) { \
            fields (entityId: 1) { \
                id \
                name \
            } \
        } \
    }', { caseId: Ringtail.Context.caseId });
}).then(function (response) {
    Data.fields = response.data.cases[0].fields;
    updateTools();
});