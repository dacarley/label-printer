# Label Printer — Behavior Spec (draft for acceptance)

Status: **draft — awaiting acceptance before any implementation.**  
Evidence date: 2026-10-11.  
Live site: https://dacarley.github.io/label-printer/  
Repo HEAD / live deploy: `f1d676a26d7a76176f3ea4ae62cfbad7887c1c2e` (`f1d676a`, 2026-02-25).

This document has four parts:

1. Deploy identity (what is live vs `main`)
2. Observed behavior (what the live app does)
3. Code behavior (what the source implements)
4. Product spec + bugs + open questions (acceptance gate)

Where observed and code agree, that agreement is treated as current behavior. Where they disagree, the item is listed as a **bug**. Where intended product behavior is not present in either, it is listed as an **open question** — not invented.

---

## 1. Deploy identity

| Item | Value |
| --- | --- |
| Live build SHA (baked into page footer) | `f1d676a` |
| Live build time (from git commit time at build) | `2/25/26, 8:13 PM` (locale-formatted) |
| Latest GitHub Pages deployment (`github-pages` environment) | SHA `f1d676a26d7a76176f3ea4ae62cfbad7887c1c2e` |
| Latest successful `Deploy to GitHub Pages` workflow | run [22414109177](https://github.com/dacarley/label-printer/actions/runs/22414109177) on `main` |
| `origin/main` / local `HEAD` | same SHA `f1d676a` |

**Anything on `main` not deployed:** none. Live matches `main` tip.

**Note (repo hygiene, not a runtime deploy gap):** committed `dist/index.html` is stale (from `29613fe`). It still has default text `Hello\nRollo`, no corner text, no Clear, no build SHA footer. Pages does **not** serve that file; the workflow runs `npm run build` and uploads a fresh `dist`. Stale `dist/` can mislead local inspection.

Deploy path (from `.github/workflows/deploy.yml`): push to `main` → `npm run ci:check` + `npm run build` → `actions/upload-pages-artifact` (`dist`) → `actions/deploy-pages`. Vite builds a single inlined `dist/index.html` with `base: "/label-printer/"`.

---

## 2. Observed behavior (live site)

Primary evidence: Playwright against the live URL (scripted user actions). Secondary: desktop Chrome session (text entry, Ctrl+P print dialog, localStorage after restart). Probe screenshots: `/opt/cursor/artifacts/label-printer-spec/`.

### 2.1 First load (no saved settings)

- Title: **Label Print**. Two panels: **Label Printer** (controls) and **Preview**.
- Defaults: width `4` in, height `6` in, padding `0.2` in, orientation **Portrait**, empty main text, empty corner text.
- Preview: blank white portrait label.
- Overflow warning hidden.
- **Print** enabled (not disabled when empty).
- Footer: `sha: · f1d676a · <locale datetime>`.

### 2.2 Main text

- Typing updates preview immediately.
- Main text is auto-fit (largest size that still fits the main area). Multi-line address renders centered in the label body.
- `white-space: pre` — newlines preserved; no wrapping of long tokens.

### 2.3 Corner text

- Optional single-line field; placeholder `e.g. FRAGILE`.
- Appears at the top of the oriented content, right-aligned; long text clips (`overflow: hidden`, no wrap). Measured overflow: `scrollWidth > clientWidth` for long strings.
- A matching bottom spacer keeps main text vertically centered when corner text is present.

### 2.4 Orientation

- **Portrait** / **Landscape** toggle updates `aria-pressed` and preview rotation.
- Landscape rotates content 90° inside a label whose outer box stays width×height (page stays the same outer dimensions).

### 2.5 Label size modal

- **Label size…** opens modal with presets **4×6** (`w=4,h=6,pad=0.20`) and **2×1** (`w=2,h=1,pad=0.10`), plus Width / Height / Padding number inputs.
- Editing width/height/padding updates the live preview **while the modal is open**.
- **Cancel** closes the modal but **does not revert** edited values.
- **OK** closes the modal (values already applied).
- Preset click applies values, updates preview, closes modal.
- Escape and click on backdrop close the modal (same non-revert behavior as Cancel).

### 2.6 Overflow

- On **2×1** with a multi-line address, red warning appears:  
  `This text can't fit even at the minimum font size. Shorten a line or increase label size.`
- Preview font drops to minimum (`6px` in preview). Print still available.

### 2.7 Clear

- Clears main text and corner text only.
- Does **not** reset orientation or label size.

### 2.8 Persistence

- Settings saved to `localStorage` key `label_printer_v4_settings` (debounced ~120ms).
- Survives reload: text, corner text, width, height, padding, orientation. `align` is stored as `"center"`.

### 2.9 Print path (observed)

**App Print button** (instrumented: stub `window.print`):

1. Re-fit / re-render print DOM synchronously.
2. Blur focused inputs.
3. Inject `@page { size: <w>in <h>in; margin: 0; }`.
4. Call `window.print()`.
5. Remove `@page` style after ~1.5s; restore scroll; ignore further Print clicks for ~800ms.

**Browser print without the button (Ctrl+P / system print):**

- Print media still hides `.app` and shows `#printRoot`.
- **Does not** inject the label `@page` size (stays `@page { size: auto; margin: 0 }` unless Print was clicked recently).
- In Chrome “Save as PDF” dialog, label content can appear as a small region on a larger sheet — easy to misread as “not centered.”

**Print output extras:**

- Build SHA footer remains visible under the label in print media (not hidden).
- Measured print content height for a 4×6 label plus SHA ≈ **7.5 in** vs **6 in** page height → content taller than one label page (blank/extra page risk; matches historical “blank second page” fix commits).

**Empty print:** allowed; dialog still opens.

### 2.10 Flaky / confusing paths (observed)

| Path | What happens |
| --- | --- |
| Cancel in size modal | Looks like “discard” but keeps edits |
| OK vs Cancel | Both close; OK’s only extra is an explicit `save()` (inputs already auto-save) |
| Ctrl+P / share-sheet print | Skips app print prep → wrong/missing `@page` size |
| Build SHA in print | Appears on the printed page; can exceed label height |
| Double-click Print | Second click ignored for ~800ms |
| Overflow still printable | Warning shown; Print not blocked |
| Small labels + corner text | Fixed ~0.375 in corner band dominates 2×1 height |
| Padding typed above max | Input can show e.g. `5` while layout uses clamped value (~0.49 on 2×1) |
| No current size shown on main screen | User must open modal to see dimensions |
| Alignment | Always centered; no control in UI |
| iOS / AirPrint | Not re-tested on device in this pass; repo history shows repeated iOS blank-page / zoom / gesture issues — treat as historically flaky |

---

## 3. Code behavior (source of truth in repo)

Modules: `src/app.ts`, `src/state/*`, `src/layout/fitText.ts`, `src/render/*`, `src/print/*`, `src/ui/*`, `src/styles/app.css`, `index.html`.

### 3.1 Purpose implemented by code

A client-only web app that:

1. Lets the user enter label text (and optional corner text),
2. Chooses label size (inches) and portrait/landscape content orientation,
3. Live-previews auto-fitted text,
4. Prints via the browser print pipeline with `@page` sized to the label,
5. Persists the form in `localStorage`.

README states printing + fitting are intentionally imperative/synchronous for **iOS/AirPrint reliability**.

### 3.2 Settings model

```ts
widthIn, heightIn, paddingIn, orientation, text, align, cornerText
```

Normalization (`normalizeSettings`):

| Field | Rules |
| --- | --- |
| width | parse float, default 4, clamp `[0.5, 20]` |
| height | parse float, default 6, clamp `[0.5, 30]` |
| padding | default 0.2, clamp `[0, min(w,h)/2 - 0.01]` |
| orientation | `"landscape"` or else `"portrait"` |
| align | left/right/center if provided; else center — **but `getRaw()` always sends `"center"`** |
| text | `\r\n` → `\n` |
| cornerText | same newline normalize, then **first line only** (`.replace(/\n.*/s, "")`) |

Page geometry note in code: *page stays portrait; “landscape” rotates content inside the label area.*

### 3.3 Screens

**Main screen**

- Corner text input
- Main textarea (autosizes on narrow viewports)
- Overflow warning (hidden by default)
- Portrait / Landscape segmented control
- Label size… / Clear
- Print
- Preview panel (white label, dashed outer frame)
- Build SHA footer

**Label size modal**

- Presets 4×6, 2×1
- Width / Height / Padding
- Cancel / OK

**Print surface (not a user “screen”)**

- Hidden `#printRoot` kept warm offscreen; becomes the only app content in `@media print`
- `#printOverlay` exists in DOM/CSS but is empty and forced `display: none` in a later print rule (dead path)

### 3.4 Controls (code)

| Control | Behavior |
| --- | --- |
| Corner text | `input`; on input → autosize textarea, `updateAll`, debounced save |
| Main text | `textarea`; same |
| Portrait / Landscape | set orientation → button state → updateAll → save |
| Label size… | open modal |
| Modal W/H/Pad | on input → updateAll → save (live) |
| Preset 4×6 / 2×1 | set fields → updateAll → save → close modal |
| OK | close modal → save |
| Cancel / Esc / backdrop | close modal only (no revert) |
| Clear | clear text + cornerText → updateAll → save (keep size/orientation) |
| Print | autosize → updateAll → save → `printNow()` |

### 3.5 Preview vs print fitting

| | Preview | Print |
| --- | --- | --- |
| Fit unit | `px`, min 6, max 1200 | `pt`, min 4, max 800 |
| Overflow warn | based on preview min fit | none |
| Corner band | 36px / 21px font | 0.375in / 21pt |

### 3.6 Print implementation

`createPrintNow`:

- Re-entrancy gate (`printing` true for 800ms; comments say `afterprint` unreliable on iOS)
- Snapshot settings → `renderPrintRoot` → blur → remember scroll → `setPageSizeInches` → `window.print()` → clear page style at 1500ms → restore scroll

There is **no** success/failure callback, **no** block on overflow, **no** empty-text guard, **no** hide of `.buildSha` in print CSS.

### 3.7 Empty / error states in code

| State | Behavior |
| --- | --- |
| Empty text | Preview blank; Print still runs |
| Text won’t fit at min size | Show `#overflowWarn`; still printable |
| Invalid number inputs | Fall back / clamp in normalize; raw input value may remain invalid in the field |
| localStorage failure | load/save swallow errors |
| `renderPrintRoot` throw | swallowed in `updateAll` / `printNow` |

---

## 4. Bugs (observed ≠ code intent, or code contradicts itself/UI)

These are disagreements or broken contracts supported by evidence. Not a wishlist.

1. **Build SHA prints on the label page**  
   Footer is visible in `@media print` and sits below `#printRoot`. For 4×6, total print content height exceeds 6 in → extra/blank page risk (historical commits already fought blank second pages).

2. **Size modal Cancel does not cancel**  
   UI says Cancel; code only closes. Edits already applied and likely already saved. **Accepted fix:** Cancel/Esc/backdrop must restore W/H/Pad to open-time values.

3. **OK and Cancel are nearly identical**  
   Both close; values already live-applied via `input` handlers. OK additionally calls `save()`. **Accepted fix:** OK commits; Cancel reverts (see bug #2).

4. **System print (Ctrl+P / iOS share) bypasses print prep**  
   Skips `@page` sizing, blur, and gated `printNow`. Observed Chrome PDF dialog then shows label on a non-label sheet.

5. **Padding field can lie**  
   User can type values above clamp; CSS/layout use clamped padding while the input still shows the out-of-range number.

6. **Dead / conflicting print overlay**  
   `#printOverlay` is never filled; one print rule sets it `display: block`, a later rule sets `display: none`. Real path is `#printRoot` only.

7. **Align is half-implemented**  
   Types, normalize, preview/print layout support left/center/right, but UI and `getRaw()` force center. Stored `align` is always `"center"` from the app. **Accepted product choice:** center-only — leftover left/right code paths are dead weight to clean up later, not a feature to expose.

8. **Committed `dist/index.html` ≠ live/source**  
   Stale artifact with `Hello\nRollo` default and without corner/Clear/SHA. Not what Pages serves, but it is what a naive open of `dist/` shows. **Accepted fix:** remove committed `dist/` from git and add `dist/` to `.gitignore`; CI/workflow builds it on deploy.

9. **Corner text vs small labels**  
   Fixed ~0.375 in band is coded for both preview and print; on 2×1 this consumes a large fraction of height and interacts badly with overflow. **Accepted fix:** shrink corner text to fit (not fixed-band clip).

---

## 5. Product spec (acceptance draft)

Only behaviors evidenced by the live app + source are stated as requirements. Gaps are questions in §6.

### 5.1 What the app is for

**Label Printer** is a mobile-friendly, client-only web app for composing a short text label and printing it at a chosen physical size through the browser’s print dialog (designed with iOS/AirPrint reliability in mind). It is not a shipping-rate or barcode service.

Typical use: type label text → optionally add a small corner mark → pick size/orientation → preview → Print → choose the Rollo (or other label printer) in the system dialog → confirm.

### 5.2 Rollo label sizes and print path

**Sizes in the product today**

| Preset | Width | Height | Default padding |
| --- | --- | --- | --- |
| 4×6 | 4 in | 6 in | 0.20 in |
| 2×1 | 2 in | 1 in | 0.10 in |

Custom width/height/padding are also allowed within clamp ranges (§3.2).

**Confirmed hardware (from owner):** [Amazon B09VF4Z2WQ](https://www.amazon.com/dp/B09VF4Z2WQ) = **Rollo Wireless X1040** — Wi‑Fi + USB direct-thermal label printer, AirPrint-certified, 203 dpi, media widths ~1.57–4.1 in (4×6 and 2×1 among defaults). This app’s presets match those two.

**Confirmed primary clients (from owner):** **Chrome on iOS** and **Safari on iOS** (AirPrint to the X1040). Other devices/browsers are occasional secondary targets — keep the print path portable, but optimize and regression-test iOS first.

**Print path implemented (required unless you change it)**

1. User taps **Print** (in-app).
2. App synchronously renders `#printRoot` to current settings, blurs inputs, sets `@page` to `widthIn × heightIn` with zero margin.
3. Browser/OS print UI opens (`window.print()`).
4. User selects the printer / paper size as offered by the OS (AirPrint/Rollo when available) and confirms or cancels.
5. App clears the temporary `@page` style after a short delay and returns to the editor.

**Out of scope unless you say otherwise:** drivers, Rollo portal custom media setup, PDF download as a first-class feature, server-side rendering.

### 5.3 Screens

#### A. Editor + Preview (default)

**Empty state**

- Empty main text and corner text (no sample content for first-time users).
- While a text field is blank, it shows greyed placeholder/hint text in the field (not real value; not printed). Existing placeholders today: main `Type your label text here...`, corner `e.g. FRAGILE`.
- Preview shows empty white label at current size (default 4×6 portrait).
- No overflow warning.
- Print stays enabled but does not open the system UI (see empty-print rule).

**With content**

- Preview mirrors text, corner text, orientation, size, padding.
- Main text auto-fits; overflow warning if even minimum size does not fit.

#### B. Label size modal

- Presets and numeric fields as above.
- **Cancel / Esc / backdrop:** discard in-modal edits and restore W/H/Pad to the values from when the modal opened (proper cancel). Live preview may show edits while open, but discarding must put both fields and preview back.
- **OK:** commit the edited values and close.
- **Preset click:** apply that preset (commit), update preview, close.

#### C. System print UI

- Owned by the browser/OS. App responsibility ends at invoking print with correct page size and label DOM.

### 5.4 Controls (normative = current code, pending Qs)

| Control | Spec |
| --- | --- |
| Corner text | Optional; single visual line; upper area of oriented label; right-aligned; **font size shrinks to fit** the label (not a fixed band that clips on small sizes) |
| Main text | Multiline; preserved whitespace; **always horizontally centered** (no align control); vertically centered in remaining area; auto-fit |
| Portrait / Landscape | Portrait = no content rotation; Landscape = 90° content rotation inside fixed outer WxH page |
| Label size… | Opens size modal |
| Clear | Full reset: clear main + corner text, orientation → Portrait, size/padding → default 4×6 / 0.2 in |
| Print | Runs in-app print path (§5.2); gated against rapid double invocation |
| Size presets | Apply size+padding and close modal |
| W / H / Pad | Inches; clamped per §3.2 |
| Build SHA | On-screen diagnostics only; **must not appear on printed label** (bug #1 vs current code) |

### 5.5 Error and empty states

| State | Spec (current) |
| --- | --- |
| Empty label (main + corner both empty) | Print stays enabled; show that there is nothing to print; **do not** open the system print UI until there is text |
| Overflow | Warn in editor; if user taps Print, confirm before opening the system print UI |
| Storage failure | Silent; app still works for the session |
| Print cancel | Return to editor; no error toast (no completion tracking today) |

### 5.6 What “done” means for a print

**Accepted:** a print is **done** when the in-app **Print** path has handed the system print UI a correct job: up-to-date `#printRoot` label DOM and `@page` sized to the current label, with zero margin.

The app does **not** observe whether the user confirmed or cancelled in the system dialog, nor whether a physical label ejected. Physical/AirPrint defects are reported by the owner when encountered.

Known clean-page defects (build SHA on the printed page, content taller than one label → blank second page) remain **bugs to fix** so the job we hand off is actually clean — they are not a separate “done = physical success” requirement.

---

## 6. Open questions (do not invent answers)

1. ~~**Primary print target**~~ **Answered:** Hardware = **Rollo Wireless X1040**; primary clients = **Chrome on iOS** and **Safari on iOS**; other devices/browsers secondary.
2. ~~**Size modal Cancel**~~ **Answered:** Proper cancel with restore — Cancel/Esc/backdrop discard edits and restore W/H/Pad (and preview) to values from when the modal opened. OK commits.
3. ~~**Print “done”**~~ **Answered:** Success = in-app Print handed the system UI a correct job (`#printRoot` + `@page` size). No completion detection beyond that; owner reports physical/AirPrint bugs if seen. Clean-page bugs (SHA / extra page) still must be fixed so that job is clean.
4. ~~**Empty print**~~ **Answered:** Print stays enabled. When main and corner text are both empty, say there is nothing to print and **do not** open the system print UI until there is text.
5. ~~**Overflow**~~ **Answered:** Keep the overflow warning in the editor. On Print while overflowing, ask for confirmation before opening the system print UI (do not silently print; do not hard-block without a choice).
6. ~~**Clear**~~ **Answered:** Full reset — clear main + corner text, set orientation to Portrait, restore default size/padding (4×6 / 0.2 in), update preview, and persist.
7. ~~**Alignment**~~ **Answered:** Center-only permanently; no left/right controls.
8. ~~**Corner text on small labels**~~ **Answered:** Shrink corner text to fit the label (do not keep a fixed ~0.375 in clipping band; do not hide).
9. ~~**Default text**~~ **Answered:** Blank for first-time users (not `Hello`/`Rollo`). Blank fields show greyed placeholder/hint text in the inputs; placeholders are not printed.
10. ~~**Additional Rollo presets**~~ **Answered:** Keep only **4×6** and **2×1** presets, plus custom W/H/Pad. No extra presets for now.
11. ~~**Committed `dist/`**~~ **Answered:** Remove from git and gitignore `dist/`. Pages/CI builds on deploy; do not commit build output.
12. **Landscape meaning on Rollo:** Confirm that “rotate content inside fixed WxH” matches how you load stock (vs swapping page width/height).

---

## 7. Acceptance

Please reply with:

- Accept / accept with edits to this spec
- Answers to the open questions you care about (Q1–Q3 answered; continue from Q4)

Implementation starts only after that.
