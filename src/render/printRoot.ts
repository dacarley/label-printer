import { bestFitFont } from "../layout/fitText";
import type { LabelSettings } from "../state/types";

export function renderPrintRoot(printRoot: HTMLDivElement, s: LabelSettings) {
	// Keep the printable DOM in the main document so iOS Safari can reliably print it within the user gesture.
	printRoot.innerHTML = "";
	printRoot.setAttribute("aria-hidden", "true");

	const label = document.createElement("div");
	label.className = "printLabel";
	label.style.width = `calc(${s.widthIn} * 1in)`;
	label.style.height = `calc(${s.heightIn} * 1in)`;

	const inner = document.createElement("div");
	inner.className = "printInner";

	const rotator = document.createElement("div");
	rotator.className = `rotator ${s.orientation === "landscape" ? "landscape" : "portrait"}`;

	const span = document.createElement("span");
	span.className = "printSpan";
	span.textContent = s.text;

	span.style.textAlign = s.align;
	rotator.style.justifyContent =
		s.align === "left"
			? "flex-start"
			: s.align === "right"
				? "flex-end"
				: "center";
	rotator.style.paddingLeft = s.align === "left" ? "0.10in" : "0";
	rotator.style.paddingRight = s.align === "right" ? "0.10in" : "0";

	rotator.appendChild(span);
	inner.appendChild(rotator);
	label.appendChild(inner);
	printRoot.appendChild(label);

	// Ensure layout exists before fitting
	void inner.offsetHeight;

	// Fit using points for printing
	bestFitFont(span, inner, "pt", 4, 800);

	void inner.offsetHeight;

	// Set a size so WebKit doesn't treat it as non-renderable
	printRoot.style.width = `calc(${s.widthIn} * 1in)`;
	printRoot.style.height = `calc(${s.heightIn} * 1in)`;
}
