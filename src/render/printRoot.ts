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

	// Corner text
	const cornerSpan = document.createElement("span");
	cornerSpan.className = "cornerTextSpan";
	cornerSpan.textContent = s.cornerText;
	cornerSpan.style.display = s.cornerText ? "" : "none";
	rotator.appendChild(cornerSpan);

	// Main text area
	const mainArea = document.createElement("div");
	mainArea.className = "printMainArea";

	const span = document.createElement("span");
	span.className = "printSpan";
	span.textContent = s.text;

	span.style.textAlign = s.align;
	mainArea.style.justifyContent =
		s.align === "left"
			? "flex-start"
			: s.align === "right"
				? "flex-end"
				: "center";
	mainArea.style.paddingLeft = s.align === "left" ? "0.10in" : "0";
	mainArea.style.paddingRight = s.align === "right" ? "0.10in" : "0";

	mainArea.appendChild(span);
	rotator.appendChild(mainArea);

	// Spacer mirrors corner text height so main text stays vertically centered
	const spacer = document.createElement("div");
	spacer.className = "cornerTextSpacer";
	spacer.style.display = s.cornerText ? "" : "none";
	rotator.appendChild(spacer);

	inner.appendChild(rotator);
	label.appendChild(inner);
	printRoot.appendChild(label);

	// Ensure layout exists before fitting
	void inner.offsetHeight;

	// Fit using points for printing (against mainArea, not inner, to respect corner text space)
	bestFitFont(span, mainArea, "pt", 4, 800);

	void inner.offsetHeight;

	// Set a size so WebKit doesn't treat it as non-renderable
	printRoot.style.width = `calc(${s.widthIn} * 1in)`;
	printRoot.style.height = `calc(${s.heightIn} * 1in)`;
}
