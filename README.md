# Label Printer (Vanilla TS + Single-File Build)

This is the Label Printer app refactored into:
- TypeScript
- Small focused modules (state, layout, render, print, ui)
- Vite bundling
- **Single-file** output: `dist/index.html` (JS+CSS fully inlined)

## Requirements
- Node.js 18+

## Install
```bash
npm install
```

## Dev
```bash
npm run dev
```

## Build (single HTML)
```bash
npm run build
```

Output:
- `dist/index.html` (single file)

## Notes
Printing + text fitting is intentionally imperative and synchronous to preserve iOS/AirPrint reliability.
