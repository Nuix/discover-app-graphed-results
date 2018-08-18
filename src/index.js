'use strict';

import GoldenLayout from 'golden-layout';
import 'golden-layout/src/css/goldenlayout-base.css';
import 'golden-layout/src/css/goldenlayout-light-theme.css';

// Promise polyfill for IE11
import 'promise-polyfill/src/polyfill';

// Provides Ringtail communication and utility APIs
import 'ringtail-extension-sdk';

// Our own dependencies
import GraphPanel from './graphPanel';


// Track our state here so we can differentiate it from local variables by namespace
global.Data = {
    fields: null,               // Populated once on load via Ringtail API query
    syncingSelection: false,    // True when setting selection to prevent cycles
    searchResultId: null,       // Updated via ActiveDocument event so we can detect changes
    layout: null,               // GoldenLayout root
};

let SaveStateId;
const DefaultState = {
    dimensions: {
        borderWidth: 7
    },
    settings: {
        showPopoutIcon: false,
        showCloseIcon: false
    },
    content:[{
        type: 'row',
        content:[{
            type: 'component',
            componentName: 'graph'
        }]
    }]
};


function updateTools() {
    const isWorkspace = Ringtail.Context.hostLocation === 'Workspace';
    // Construct native Ringtail controls in the pane's toolbar to customize the graphs
    Ringtail.setTools([{
        type: 'button',
        icon: isWorkspace ? 'icon-page-refresh' : 'icon-a-update-index',
        id: 'refreshButton',
        label: 'Reload'
    }, {
        type: 'button',
        icon: isWorkspace ? 'icon-add' : 'icon-a-add',
        id: 'addButton',
        label: 'Add panel'
    // }, {
    //     type: 'button',
    //     icon: 'icon-print',
    //     id: 'printButton',
    //     label: 'Print'
    }]);
}

function buildWorkspace() {
    if (Data.layout) return;

    SaveStateId = 'Layout-' + Ringtail.Context.hostLocation;
    let state = null;
    try {
        state = JSON.parse(localStorage.getItem(SaveStateId));
    } catch (ex) { }
    if (!state) {
        state = DefaultState;
    }

    Data.layout = new GoldenLayout(state);

    Data.layout.registerComponent('graph', function (container, state) {
        container.parent.graphPanel = new GraphPanel(container, state);
    });

    Data.layout.init();
    checkEmpty();

    Data.layout.on('stateChanged', function () {
        var state = JSON.stringify(Data.layout.toConfig());
        localStorage.setItem(SaveStateId, state);
        checkEmpty();
    });
}

function getPanels() {
    return (Data.layout && Data.layout.root.contentItems.length)
        ? Data.layout.root.contentItems[0].getItemsByType('component')
        : [];
}

function checkEmpty() {
    if (Data.layout && getPanels().length < 1) {
        Data.layout.destroy();
        Data.layout = null;
        localStorage.removeItem(SaveStateId);
        buildWorkspace();
    }
}

function loadData() {
    if (!Data.layout) return;

    loadFields(true).then(function () {
        getPanels().forEach(function (container) {
            container.graphPanel.loadData();
        });
    });
}

function loadFields(refreshFromServer) {
    try {
        Data.fields = JSON.parse(localStorage.getItem('fields-' + Ringtail.Context.caseUuid));
    } catch (ex) { }

    if (Data.fields && !refreshFromServer) {
        return Promise.resolve();
    }

    setTimeout(function () {
        Ringtail.setLoading(true);
    }, 10);
    
    // Request available coding fields for this user to display in a field picker
    // from Ringtail via GraphQL
    return Ringtail.query(' \
    query ($caseId: Int!) { \
        cases (id: $caseId) { \
            fields (entityId: 1) { \
                id \
                name \
                items { \
                    id \
                    name \
                    count \
                } \
            } \
        } \
    }', {
        caseId: Ringtail.Context.caseId
    }).then(function (response) {
        Data.fields = response.data.cases[0].fields;
        Data.fields.sort(function (left, right) {
            return left.name.localeCompare(right.name);
        });
        Data.fields.unshift({ id: 0, name: 'Select a field' });
        localStorage.setItem('fields-' + Ringtail.Context.caseUuid, JSON.stringify(Data.fields));
    });
}

function handleActiveDocChanged(msg) {
    if (msg.data.searchResultId !== Data.searchResultId) {
        // We only need to reload when the result set changes - ignore other changes!
        buildWorkspace();
        loadData();
    }
}

function handleBrowseSelectionChanged(msg) {
    Data.syncingSelection = true;
    try {
        getPanels().forEach(function (container) {
            container.graphPanel.select(msg.data);
        })
    } finally {
        Data.syncingSelection = false;
    }
}

function handleToolAction(msg) {
    switch (msg.data.id) {
        case 'printButton':
            window.print();
            break;
        case 'refreshButton':
            loadData();
            break;
        case 'addButton':
            Data.layout.root.contentItems[0].addChild({
                type: 'component',
                componentName: 'graph'
            });
            break;
    }
}

if (window.matchMedia) {
    var mediaQueryList = window.matchMedia('print');
    mediaQueryList.addListener(function (mql) {
        const printing = !!mql.matches;
        getPanels().forEach(function (container) {
            container.graphPanel.setPrintMode(printing);
        });
    });
}

// Register ourselves as a UIX with Ringtail and open communications
Ringtail.initialize().then(function () {
    return loadFields();
}).then(function () {
    updateTools();
    
    // Listen for these events from Ringtail
    Ringtail.on('ActiveDocument', handleActiveDocChanged);
    Ringtail.on('BrowseSelection', handleBrowseSelectionChanged);
    Ringtail.on('ToolAction', handleToolAction);

    buildWorkspace();
});