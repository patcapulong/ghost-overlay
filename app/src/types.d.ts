interface GhostAPI {
  onImageReceived: (callback: (imageData: string) => void) => void;
  onOpacityChanged: (callback: (opacity: number) => void) => void;
  setOpacity: (opacity: number) => void;
  setIgnoreMouseEvents: (ignore: boolean) => void;
  moveWindow: (deltaX: number, deltaY: number) => void;
  closeOverlay: () => void;
}

interface Window {
  ghostAPI: GhostAPI;
}
