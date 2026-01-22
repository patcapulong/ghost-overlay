"use strict";
// Ghost Overlay - Figma Plugin
// Exports selected frames and sends them to the desktop overlay app
figma.showUI(__html__, {
    width: 280,
    height: 200,
    themeColors: true,
});
// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'export-selection') {
        await exportSelection();
    }
    else if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};
async function exportSelection() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.ui.postMessage({
            type: 'error',
            message: 'Please select a frame or component to export',
        });
        return;
    }
    if (selection.length > 1) {
        figma.ui.postMessage({
            type: 'error',
            message: 'Please select only one frame',
        });
        return;
    }
    const node = selection[0];
    // Check if the node can be exported
    if (!('exportAsync' in node)) {
        figma.ui.postMessage({
            type: 'error',
            message: 'Selected element cannot be exported',
        });
        return;
    }
    try {
        figma.ui.postMessage({ type: 'status', message: 'Exporting...' });
        // Export at 2x scale as PNG for HiDPI/Retina displays
        const bytes = await node.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 2 },
        });
        // Convert to base64
        const base64 = figma.base64Encode(bytes);
        // Get dimensions
        const width = Math.round(node.width);
        const height = Math.round(node.height);
        // Send to UI to forward to desktop app
        figma.ui.postMessage({
            type: 'image-data',
            data: base64,
            width: width,
            height: height,
            name: node.name,
        });
    }
    catch (error) {
        figma.ui.postMessage({
            type: 'error',
            message: `Export failed: ${error}`,
        });
    }
}
// Listen for selection changes
figma.on('selectionchange', () => {
    const selection = figma.currentPage.selection;
    if (selection.length === 1) {
        const node = selection[0];
        figma.ui.postMessage({
            type: 'selection-changed',
            name: node.name,
            width: Math.round(node.width),
            height: Math.round(node.height),
        });
    }
    else {
        figma.ui.postMessage({
            type: 'selection-changed',
            name: null,
        });
    }
});
// Send initial selection state
const initialSelection = figma.currentPage.selection;
if (initialSelection.length === 1) {
    const node = initialSelection[0];
    figma.ui.postMessage({
        type: 'selection-changed',
        name: node.name,
        width: Math.round(node.width),
        height: Math.round(node.height),
    });
}
