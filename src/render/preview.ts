import { fitCornerText } from "../layout/fitCorner";
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

/** Product is center-only; keep main text centered. */
export function applyCenteredMain(
	previewSpan: HTMLElement,
	previewMainArea: HTMLElement,
) {
	previewSpan.style.textAlign = "center";
	previewMainArea.style.justifyContent = "center";
	previewMainArea.style.paddingLeft = "0";
	previewMainArea.style.paddingRight = "0";
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
	containerEl: HTMLElement,
) {
	fitCornerText(cornerSpan, spacer, containerEl, text, "px", 6, 28);
}
