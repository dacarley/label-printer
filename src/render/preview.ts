import type { LabelSettings } from "../state/types";

export function setCSSVars(s: LabelSettings) {
	document.documentElement.style.setProperty("--label-w-in", String(s.widthIn));
	document.documentElement.style.setProperty(
		"--label-h-in",
		String(s.heightIn),
	);
	document.documentElement.style.setProperty(
		"--padding-in",
		String(s.paddingIn),
	);
}

export function applyAlignment(
	previewSpan: HTMLElement,
	previewMainArea: HTMLElement,
	align: LabelSettings["align"],
) {
	previewSpan.style.textAlign = align;
	(previewMainArea as HTMLElement).style.justifyContent =
		align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
	(previewMainArea as HTMLElement).style.paddingLeft =
		align === "left" ? "0.10in" : "0";
	(previewMainArea as HTMLElement).style.paddingRight =
		align === "right" ? "0.10in" : "0";
}

export function setRotation(
	previewRotator: HTMLElement,
	orientation: LabelSettings["orientation"],
) {
	previewRotator.classList.toggle("landscape", orientation === "landscape");
}

export function setPreviewText(previewSpan: HTMLElement, text: string) {
	previewSpan.textContent = text;
}

export function setCornerText(
	cornerSpan: HTMLElement,
	text: string,
	spacer: HTMLElement,
) {
	cornerSpan.textContent = text;
	cornerSpan.style.display = text ? "" : "none";
	spacer.style.display = text ? "" : "none";
}
