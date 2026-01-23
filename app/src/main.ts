import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, screen } from 'electron';
import * as path from 'path';
import { WebSocketServer, WebSocket } from 'ws';

let tray: Tray | null = null;
let overlayWindow: BrowserWindow | null = null;
let wss: WebSocketServer | null = null;
let currentOpacity = 0.5;
let lastPosition = { x: 100, y: 100 };
let lastSize = { width: 400, height: 800 };

const PORT = 47777;

function createTray() {
  // Create a 1x1 transparent icon (required for tray) and use title for visibility
  const icon = nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setTitle('👻'); // Shows ghost emoji in menu bar - visible on light/dark
  tray.setToolTip('Ghost Overlay');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ghost Overlay',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Show/Hide Overlay',
      accelerator: 'CmdOrCtrl+Shift+O',
      click: () => toggleOverlay(),
    },
    { type: 'separator' },
    {
      label: 'Increase Opacity',
      accelerator: 'CmdOrCtrl+]',
      click: () => adjustOpacity(0.1),
    },
    {
      label: 'Decrease Opacity',
      accelerator: 'CmdOrCtrl+[',
      click: () => adjustOpacity(-0.1),
    },
    { type: 'separator' },
    {
      label: `Server: ws://localhost:${PORT}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: lastSize.width,
    height: lastSize.height,
    x: lastPosition.x,
    y: lastPosition.y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.loadFile(path.join(__dirname, '..', 'src', 'overlay.html'));
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  
  // Start with click-through enabled, forward mouse events so we can detect position
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  overlayWindow.on('moved', () => {
    if (overlayWindow) {
      const bounds = overlayWindow.getBounds();
      lastPosition = { x: bounds.x, y: bounds.y };
    }
  });

  overlayWindow.on('resized', () => {
    if (overlayWindow) {
      const bounds = overlayWindow.getBounds();
      lastSize = { width: bounds.width, height: bounds.height };
    }
  });

  // Hide by default until image is received
  overlayWindow.hide();
}

function toggleOverlay() {
  if (!overlayWindow) {
    createOverlayWindow();
    return;
  }

  if (overlayWindow.isVisible()) {
    overlayWindow.hide();
  } else {
    overlayWindow.show();
  }
}

function adjustOpacity(delta: number) {
  currentOpacity = Math.max(0.1, Math.min(1.0, currentOpacity + delta));
  if (overlayWindow) {
    overlayWindow.webContents.send('opacity-changed', currentOpacity);
  }
}

function setupWebSocketServer() {
  wss = new WebSocketServer({ port: PORT });

  wss.on('listening', () => {
    console.log(`Ghost Overlay WebSocket server running on ws://localhost:${PORT}`);
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Figma plugin connected');

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'image') {
          // Received image from Figma plugin (exported at 2x for HiDPI)
          const imageData = message.data; // base64 PNG
          const width = message.width || 400;
          const height = message.height || 800;

          if (!overlayWindow) {
            createOverlayWindow();
          }

          // Window size is 1x (design size), image is 2x for sharpness on HiDPI
          if (overlayWindow) {
            overlayWindow.setSize(width, height);
            lastSize = { width, height };
            overlayWindow.webContents.send('image-received', imageData);
            overlayWindow.show();
          }
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    ws.on('close', () => {
      console.log('Figma plugin disconnected');
    });

    // Send current state to plugin
    ws.send(JSON.stringify({ type: 'connected', port: PORT }));
  });

  wss.on('error', (error: Error) => {
    console.error('WebSocket server error:', error);
  });
}

function registerShortcuts() {
  globalShortcut.register('CmdOrCtrl+Shift+O', toggleOverlay);
  globalShortcut.register('CmdOrCtrl+[', () => adjustOpacity(-0.1));
  globalShortcut.register('CmdOrCtrl+]', () => adjustOpacity(0.1));
  // Note: Removed global Escape shortcut as it interferes with other apps
  // Users can hide overlay via ✕ button or ⌘⇧O
}

// IPC handlers
ipcMain.on('set-opacity', (_, opacity: number) => {
  currentOpacity = opacity;
  if (overlayWindow) {
    overlayWindow.webContents.send('opacity-changed', currentOpacity);
  }
});

ipcMain.on('set-ignore-mouse-events', (_, ignore: boolean) => {
  if (overlayWindow) {
    overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

ipcMain.on('move-window', (_, deltaX: number, deltaY: number) => {
  if (overlayWindow) {
    const [x, y] = overlayWindow.getPosition();
    overlayWindow.setPosition(x + deltaX, y + deltaY);
    lastPosition = { x: x + deltaX, y: y + deltaY };
  }
});

ipcMain.on('close-overlay', () => {
  if (overlayWindow) {
    overlayWindow.hide();
  }
});

// App lifecycle
app.whenReady().then(() => {
  // Hide dock icon on macOS (menu bar app)
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  createTray();
  setupWebSocketServer();
  registerShortcuts();

  console.log('Ghost Overlay is running');
  console.log(`WebSocket server: ws://localhost:${PORT}`);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (wss) {
    wss.close();
  }
});

app.on('window-all-closed', () => {
  // Keep app running even when overlay is closed (menu bar app)
});
