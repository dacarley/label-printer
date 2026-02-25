import type { LabelSettings } from "../state/types";

export function setCSSVars(s: LabelSettings) {
  document.documentElement.style.setProperty("--label-w-in", String(s.widthIn));
  document.documentElement.style.setProperty("--label-h-in", String(s.heightIn));
  document.documentElement.style.setProperty("--padding-in", String(s.paddingIn));
}

export function applyAlignment(previewSpan: HTMLElement, previewRotator: HTMLElement, align: LabelSettings["align"]) {
  previewSpan.style.textAlign = align;
  (previewRotator as HTMLElement).style.justifyContent =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  (previewRotator as HTMLElement).style.paddingLeft = align === "left" ? "0.10in" : "0";
  (previewRotator as HTMLElement).style.paddingRight = align === "right" ? "0.10in" : "0";
}

export function setRotation(previewRotator: HTMLElement, orientation: LabelSettings["orientation"]) {
  previewRotator.classList.toggle("landscape", orientation === "landscape");
}

export function setPreviewText(previewSpan: HTMLElement, text: string) {
  previewSpan.textContent = text;
}
