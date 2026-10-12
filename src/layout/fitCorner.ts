import type { Unit } from "./fitText";

/**
 * Shrink corner text (single line) so it fits the label width and at most
 * ~35% of the label height. Sets matching spacer height so main text stays
 * vertically centered.
 */
export function fitCornerText(
	cornerSpan: HTMLElement,
	spacer: HTMLElement,
	containerEl: HTMLElement,
	text: string,
	unit: Unit,
	min: number,
	max: number,
) {
	if (!text) {
		cornerSpan.textContent = "";
		cornerSpan.style.display = "none";
		spacer.style.display = "none";
		return;
	}

	cornerSpan.textContent = text;
	cornerSpan.style.display = "";
	spacer.style.display = "";
	cornerSpan.style.whiteSpace = "nowrap";
	cornerSpan.style.overflow = "hidden";

	let lo = min;
	let hi = max;
	let best = min;

	while (lo <= hi) {
		const mid = Math.floor((lo + hi) / 2);
		const band = mid * 1.2;
		cornerSpan.style.fontSize = `${mid}${unit}`;
		cornerSpan.style.height = `${band}${unit}`;
		cornerSpan.style.lineHeight = `${band}${unit}`;
		spacer.style.height = `${band}${unit}`;

		const cRect = containerEl.getBoundingClientRect();
		const cornerRect = cornerSpan.getBoundingClientRect();
		const widthOk = cornerSpan.scrollWidth <= containerEl.clientWidth + 1;
		const heightOk =
			cRect.height <= 0 || cornerRect.height <= cRect.height * 0.35 + 1;

		if (widthOk && heightOk) {
			best = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}

	const band = best * 1.2;
	cornerSpan.style.fontSize = `${best}${unit}`;
	cornerSpan.style.height = `${band}${unit}`;
	cornerSpan.style.lineHeight = `${band}${unit}`;
	spacer.style.height = `${band}${unit}`;
}
