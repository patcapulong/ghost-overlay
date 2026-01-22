import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('ghostAPI', {
  onImageReceived: (callback: (imageData: string) => void) => {
    ipcRenderer.on('image-received', (_, imageData) => callback(imageData));
  },
  onOpacityChanged: (callback: (opacity: number) => void) => {
    ipcRenderer.on('opacity-changed', (_, opacity) => callback(opacity));
  },
  setOpacity: (opacity: number) => {
    ipcRenderer.send('set-opacity', opacity);
  },
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore);
  },
  moveWindow: (deltaX: number, deltaY: number) => {
    ipcRenderer.send('move-window', deltaX, deltaY);
  },
  closeOverlay: () => {
    ipcRenderer.send('close-overlay');
  },
});
