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
    // Construct native Ringtail controls in the pane's toolbar to customize the graphs
    Ringtail.setTools([{
        type: 'button',
        icon: 'icon-page-refresh',
        id: 'refreshButton',
        label: 'Reload'
    }, {
        type: 'button',
        icon: 'icon-add',
        id: 'addButton',
        label: 'Add panel'
    // }, {
    //     type: 'button',
    //     icon: 'icon-print',
    //     id: 'printButton',
    //     label: 'Print'
    }]);
}

function renderGraph() {
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
        renderGraph();
    }
}

function loadData() {
    if (!Data.layout) return;

    getPanels().forEach(function (container) {
        container.graphPanel.loadData();
    });
}

function handleActiveDocChanged(msg) {
    if (msg.data.searchResultId !== Data.searchResultId) {
        // We only need to reload when the result set changes - ignore other changes!
        renderGraph();
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
    setTimeout(function () {
        Ringtail.setLoading(true);
    }, 10);
    
    // Request available coding fields for this user to display in a field picker
    // from Ringtail via GraphQL
    return Ringtail.query(' \
    query ($caseId: Int!, $fieldIds: [String!]!) { \
        cases (id: $caseId) { \
            fields (entityId: 1, id: $fieldIds) { \
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
        caseId: Ringtail.Context.caseId,
        fieldIds: ["104-6", "170-6", "402-20", "404-20", "405-20", "851-20", "852-20", "10016-19"]
    });

    // return {
    //     "data": {
    //       "cases": [
    //         {
    //           "fields": [
    //             {
    //               "id": "104-6",
    //               "name": "Document Type"
    //             },
    //             {
    //               "id": "115-6",
    //               "name": "Rendition Type"
    //             },
    //             {
    //               "id": "162-6",
    //               "name": "Document Created By"
    //             },
    //             {
    //               "id": "170-6",
    //               "name": "Document Created Type"
    //             },
    //             {
    //               "id": "313-10",
    //               "name": "[RT] Master Dups Discrepancy List"
    //             },
    //             {
    //               "id": "314-20",
    //               "name": "Thread Analysis Status"
    //             },
    //             {
    //               "id": "315-20",
    //               "name": "Predictive Text Status - LEGACY"
    //             },
    //             {
    //               "id": "400-21",
    //               "name": "Production Print Status"
    //             },
    //             {
    //               "id": "401-20",
    //               "name": "Document OCR Status"
    //             },
    //             {
    //               "id": "402-20",
    //               "name": "Document Indexing Status"
    //             },
    //             {
    //               "id": "404-20",
    //               "name": "Index Name"
    //             },
    //             {
    //               "id": "405-20",
    //               "name": "Native File Extension"
    //             },
    //             {
    //               "id": "406-20",
    //               "name": "[FTI] Types of Renditions Created"
    //             },
    //             {
    //               "id": "444-20",
    //               "name": "Document Exception Status"
    //             },
    //             {
    //               "id": "445-20",
    //               "name": "Imaging Status"
    //             },
    //             {
    //               "id": "446-20",
    //               "name": "Imaging Format"
    //             },
    //             {
    //               "id": "447-20",
    //               "name": "Imaging Warnings"
    //             },
    //             {
    //               "id": "449-20",
    //               "name": "Imaging Document Info"
    //             },
    //             {
    //               "id": "451-20",
    //               "name": "Extracted Text Status"
    //             },
    //             {
    //               "id": "452-20",
    //               "name": "Extracted Text File Extension"
    //             },
    //             {
    //               "id": "454-7",
    //               "name": "From"
    //             },
    //             {
    //               "id": "455-7",
    //               "name": "To"
    //             },
    //             {
    //               "id": "456-7",
    //               "name": "Between"
    //             },
    //             {
    //               "id": "457-7",
    //               "name": "CC"
    //             },
    //             {
    //               "id": "458-7",
    //               "name": "BCC"
    //             },
    //             {
    //               "id": "471-20",
    //               "name": "File Indexing Status"
    //             },
    //             {
    //               "id": "472-20",
    //               "name": "Concept Analysis Status"
    //             },
    //             {
    //               "id": "481-20",
    //               "name": "File Indexing Errors"
    //             },
    //             {
    //               "id": "482-20",
    //               "name": "File Analysis Errors"
    //             },
    //             {
    //               "id": "800-20",
    //               "name": "Custodian"
    //             },
    //             {
    //               "id": "801-20",
    //               "name": "All Custodians"
    //             },
    //             {
    //               "id": "803-20",
    //               "name": "Collection ID"
    //             },
    //             {
    //               "id": "804-20",
    //               "name": "[Meta] Evidence ID"
    //             },
    //             {
    //               "id": "805-20",
    //               "name": "Media ID"
    //             },
    //             {
    //               "id": "808-20",
    //               "name": "[RT] Ingestion Status"
    //             },
    //             {
    //               "id": "810-20",
    //               "name": "[Meta] Processing Exceptions"
    //             },
    //             {
    //               "id": "842-20",
    //               "name": "[Meta] Document Kind"
    //             },
    //             {
    //               "id": "843-20",
    //               "name": "[Meta] Email Delivery Receipt Request"
    //             },
    //             {
    //               "id": "845-20",
    //               "name": "[Meta] Email Importance"
    //             },
    //             {
    //               "id": "848-20",
    //               "name": "[Meta] Email Read Receipt Request"
    //             },
    //             {
    //               "id": "849-20",
    //               "name": "[Meta] Email Sensitivity"
    //             },
    //             {
    //               "id": "851-20",
    //               "name": "[Meta] File Application"
    //             },
    //             {
    //               "id": "852-20",
    //               "name": "[Meta] File Extension - Loaded"
    //             },
    //             {
    //               "id": "853-20",
    //               "name": "[Meta] File Extension - Original"
    //             },
    //             {
    //               "id": "857-20",
    //               "name": "[Meta] Languages"
    //             },
    //             {
    //               "id": "861-20",
    //               "name": "[Meta] Office Exceptions"
    //             },
    //             {
    //               "id": "873-20",
    //               "name": "[Meta] PDF - Encryption Level"
    //             },
    //             {
    //               "id": "874-20",
    //               "name": "[Meta] PDF - Portfolio"
    //             },
    //             {
    //               "id": "875-20",
    //               "name": "[Meta] Processing Time Zone"
    //             },
    //             {
    //               "id": "882-20",
    //               "name": "[Meta] Document Category"
    //             },
    //             {
    //               "id": "884-20",
    //               "name": "[Meta] Entity"
    //             },
    //             {
    //               "id": "886-20",
    //               "name": "[Meta] File Extension - Loaded - Corrected"
    //             },
    //             {
    //               "id": "887-20",
    //               "name": "[Meta] Index Issue Extension"
    //             },
    //             {
    //               "id": "890-20",
    //               "name": "[Meta] Chat Participants"
    //             },
    //             {
    //               "id": "900-55",
    //               "name": "[FTI] Image Request"
    //             },
    //             {
    //               "id": "901-55",
    //               "name": "[FTI] Document Info"
    //             },
    //             {
    //               "id": "903-55",
    //               "name": "[FTI] MLT Request"
    //             },
    //             {
    //               "id": "904-55",
    //               "name": "[FTI] MLT Detected Language"
    //             },
    //             {
    //               "id": "909-56",
    //               "name": "Thread - Document Type"
    //             },
    //             {
    //               "id": "10001-19",
    //               "name": "PTF"
    //             },
    //             {
    //               "id": "10003-19",
    //               "name": "PTF [family]"
    //             },
    //             {
    //               "id": "10016-19",
    //               "name": "DMMarks"
    //             },
    //             {
    //               "id": "10017-19",
    //               "name": "DMMarks [family]"
    //             },
    //             {
    //               "id": "10059-19",
    //               "name": "Responsive Reason"
    //             },
    //             {
    //               "id": "10079-19",
    //               "name": "Identify Native"
    //             },
    //             {
    //               "id": "10211-19",
    //               "name": "Reuters_Codes"
    //             },
    //             {
    //               "id": "10212-19",
    //               "name": "Reuters_Codes_XCAT"
    //             },
    //             {
    //               "id": "10213-19",
    //               "name": "Predict Training Fields"
    //             },
    //             {
    //               "id": "10214-19",
    //               "name": "Predict Training Fields [family]"
    //             },
    //             {
    //               "id": "10239-19",
    //               "name": "Auto Data - Family Pick List"
    //             },
    //             {
    //               "id": "10240-19",
    //               "name": "Auto Data - Family Pick List [family]"
    //             },
    //             {
    //               "id": "10303-19",
    //               "name": "Auto Data For Footer"
    //             },
    //             {
    //               "id": "10305-19",
    //               "name": "[Meta] Office Exceptions Summary"
    //             },
    //             {
    //               "id": "10315-19",
    //               "name": "Production Perf"
    //             },
    //             {
    //               "id": "10322-19",
    //               "name": "[PERF] Responsiveness"
    //             },
    //             {
    //               "id": "10323-19",
    //               "name": "[PERF] Responsiveness [family]"
    //             },
    //             {
    //               "id": "10324-19",
    //               "name": "[PERF] Privilege"
    //             },
    //             {
    //               "id": "10325-19",
    //               "name": "[PERF] Privilege [family]"
    //             },
    //             {
    //               "id": "10326-19",
    //               "name": "[PERF] Confidential"
    //             },
    //             {
    //               "id": "10327-19",
    //               "name": "[PERF] Confidential [family]"
    //             },
    //             {
    //               "id": "10334-7",
    //               "name": "Snail Mail"
    //             },
    //             {
    //               "id": "10384-19",
    //               "name": "DashboardCoding"
    //             },
    //             {
    //               "id": "10385-19",
    //               "name": "DashboardCoding [family]"
    //             },
    //             {
    //               "id": "10408-19",
    //               "name": "Pick list 1:1"
    //             },
    //             {
    //               "id": "10409-19",
    //               "name": "Pick list 1:M"
    //             },
    //             {
    //               "id": "10432-19",
    //               "name": "Responsiveness"
    //             },
    //             {
    //               "id": "10433-19",
    //               "name": "Responsiveness [family]"
    //             },
    //             {
    //               "id": "10434-19",
    //               "name": "Privilege"
    //             },
    //             {
    //               "id": "10435-19",
    //               "name": "Privilege Type"
    //             },
    //             {
    //               "id": "10436-19",
    //               "name": "For Further Review Type"
    //             },
    //             {
    //               "id": "10468-19",
    //               "name": "Language Category"
    //             },
    //             {
    //               "id": "10469-19",
    //               "name": "European Languages"
    //             },
    //             {
    //               "id": "10470-19",
    //               "name": "CJK Languages"
    //             },
    //             {
    //               "id": "10475-19",
    //               "name": "KL PICK Sort"
    //             },
    //             {
    //               "id": "10479-19",
    //               "name": "Deleted field from template"
    //             },
    //             {
    //               "id": "10480-19",
    //               "name": "Deleted field from template [family]"
    //             },
    //             {
    //               "id": "10583-9",
    //               "name": "WORKSPACE date"
    //             },
    //             {
    //               "id": "10584-18",
    //               "name": "WORKSPACE num"
    //             },
    //             {
    //               "id": "10585-19",
    //               "name": "WORKSPACE pick"
    //             },
    //             {
    //               "id": "10586-19",
    //               "name": "TEST CASE fubar field"
    //             }
    //           ]
    //         }
    //       ]
    //     }
    //   };
}).then(function (response) {
    Data.fields = response.data.cases[0].fields;
    Data.fields.sort(function (left, right) {
        return left.name.localeCompare(right.name);
    });
    Data.fields.unshift({ id: 0, name: 'Select a field' });
    updateTools();
    
    // Listen for these events from Ringtail
    Ringtail.on('ActiveDocument', handleActiveDocChanged);
    Ringtail.on('BrowseSelection', handleBrowseSelectionChanged);
    Ringtail.on('ToolAction', handleToolAction);

    renderGraph();
});