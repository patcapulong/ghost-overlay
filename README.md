# 👻 Ghost Overlay

Overlay Figma designs on top of iOS Simulator, Android Emulator, or any window — for pixel-perfect development.

![Ghost Overlay Demo](https://via.placeholder.com/800x400?text=Add+Demo+GIF+Here)

## What It Does

Ghost Overlay lets you see exactly where your implementation differs from the design. No more switching between Figma and your simulator — see both at once.

1. Select a frame in Figma
2. Click "Send to Overlay"
3. Position the transparent overlay over your simulator
4. Adjust opacity and build until they match perfectly

## Installation

### 1. Desktop App (macOS)

```bash
# Clone the repo
git clone https://github.com/patcapulong/ghost-overlay.git
cd ghost-overlay/app

# Install dependencies
npm install

# Run the app
npm start
```

The app runs in your menu bar (look for the 👻 emoji).

### 2. Figma Plugin

1. Open Figma
2. Go to **Plugins → Development → Import plugin from manifest**
3. Select the `plugin/manifest.json` file from this repo

Or install from Figma Community: [Ghost Overlay Plugin](https://www.figma.com/community/plugin/YOUR_PLUGIN_ID)

## Usage

1. **Start the desktop app** — it runs in your menu bar as 👻
2. **Open Figma** and run the Ghost Overlay plugin
3. **Select a frame** you want to overlay
4. **Click "Send to Overlay"** — the design appears as a transparent overlay
5. **Position it** over your simulator using the drag handle (hover at top)
6. **Adjust opacity** with the slider (hover to reveal)
7. **Build** until your implementation matches!

## Controls

| Action | How |
|--------|-----|
| Move overlay | Drag the pill handle at top (hover to reveal) |
| Adjust opacity | Use the slider at bottom (hover to reveal) |
| Hide overlay | Click ✕ or press `Esc` |
| Show/hide | `⌘⇧O` |
| Adjust opacity | `⌘[` / `⌘]` |

The overlay is **click-through** by default — you can interact with your simulator right through it.

## Features

- **Works anywhere** — iOS Simulator, Android Emulator, browsers, any window
- **2x export** — crisp on Retina/HiDPI displays
- **Click-through** — interact with your app underneath the overlay
- **Minimal UI** — controls hide when not in use
- **Remembers position** — overlay stays where you put it

## How It Works

```
Figma Plugin ──WebSocket:47777──► Desktop App ──► Transparent Overlay
     │                                │
     └── Exports frame at 2x ────────►└── Floats on top of any window
```

The Figma plugin exports your selected frame at 2x scale and sends it via WebSocket to the desktop app, which displays it as a transparent always-on-top window.

## Development

### Desktop App

```bash
cd app
npm install
npm run dev    # Build and run
```

### Figma Plugin

```bash
cd plugin
npm install
npm run build  # Compile TypeScript
npm run watch  # Watch mode
```

Then import `plugin/manifest.json` in Figma.

## Tech Stack

- **Desktop App**: Electron + TypeScript
- **Figma Plugin**: TypeScript + Figma Plugin API
- **Communication**: WebSocket

## License

MIT

---

Made for developers who care about the details ✨
