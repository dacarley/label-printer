import type { Align, LabelSettings, Orientation, RawFormState } from "./types";

export const STORAGE_KEY = "label_printer_v4_settings";

export function clamp(n: number, a: number, b: number) {
	return Math.max(a, Math.min(b, n));
}

export function normalizeText(raw: string) {
	return (raw ?? "").replace(/\r\n/g, "\n");
}

export function parseNumberOrFallback(s: string, fallback: number) {
	const n = Number.parseFloat(String(s ?? ""));
	return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalize/clamp label inputs. This is the single source of truth for bounds.
 * NOTE: Page stays portrait; "landscape" rotates the content in the label area.
 */
export function normalizeSettings(raw: RawFormState): LabelSettings {
	const wIn = clamp(parseNumberOrFallback(raw.w, 4), 0.5, 20);
	const hIn = clamp(parseNumberOrFallback(raw.h, 6), 0.5, 30);

	// Padding must be less than half of the smallest dimension to keep a positive inner box.
	const padMax = Math.max(0, Math.min(wIn, hIn) / 2 - 0.01);
	const paddingIn = clamp(parseNumberOrFallback(raw.pad, 0.2), 0, padMax);

	const orientation: Orientation =
		raw.orientation === "landscape" ? "landscape" : "portrait";
	const align: Align =
		raw.align === "left" || raw.align === "right" || raw.align === "center"
			? raw.align
			: "center";
	const text = normalizeText(raw.text);

	return { widthIn: wIn, heightIn: hIn, paddingIn, orientation, text, align };
}

export function loadSettings(): Partial<RawFormState> | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const obj = JSON.parse(raw);
		if (obj && typeof obj === "object") return obj as Partial<RawFormState>;
		return null;
	} catch {
		return null;
	}
}

export function saveSettingsDebounced(getRaw: () => RawFormState) {
	let t: number | null = null;
	return function save() {
		if (t) window.clearTimeout(t);
		t = window.setTimeout(() => {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(getRaw()));
			} catch {}
		}, 120);
	};
}
