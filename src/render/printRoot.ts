import { fitCornerText } from "../layout/fitCorner";
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

	const cornerSpan = document.createElement("span");
	cornerSpan.className = "cornerTextSpan";
	rotator.appendChild(cornerSpan);

	const mainArea = document.createElement("div");
	mainArea.className = "printMainArea";

	const span = document.createElement("span");
	span.className = "printSpan";
	span.textContent = s.text;
	span.style.textAlign = "center";
	mainArea.style.justifyContent = "center";
	mainArea.style.paddingLeft = "0";
	mainArea.style.paddingRight = "0";

	mainArea.appendChild(span);
	rotator.appendChild(mainArea);

	const spacer = document.createElement("div");
	spacer.className = "cornerTextSpacer";
	rotator.appendChild(spacer);

	inner.appendChild(rotator);
	label.appendChild(inner);
	printRoot.appendChild(label);

	void inner.offsetHeight;

	fitCornerText(cornerSpan, spacer, rotator, s.cornerText, "pt", 4, 21);

	void inner.offsetHeight;

	bestFitFont(span, mainArea, "pt", 4, 800);

	void inner.offsetHeight;

	printRoot.style.width = `calc(${s.widthIn} * 1in)`;
	printRoot.style.height = `calc(${s.heightIn} * 1in)`;
}
