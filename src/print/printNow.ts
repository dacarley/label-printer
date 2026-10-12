import { setCSSVars } from "../render/preview";
import { renderPrintRoot } from "../render/printRoot";
import type { LabelSettings } from "../state/types";
import { clearPageSize, setPageSizeInches } from "./pageStyle";

export type PrintDeps = {
	printRoot: HTMLDivElement;
	getSnapshot: () => LabelSettings; // must return normalized settings
	blur: () => void;
};

function preparePrint(deps: PrintDeps, snapshot: LabelSettings) {
	setCSSVars(snapshot);
	try {
		renderPrintRoot(deps.printRoot, snapshot);
	} catch {}
	deps.blur();
	setPageSizeInches(snapshot.widthIn, snapshot.heightIn);

	// iOS: fixed/offscreen print roots often rasterize blank. Park the root
	// on-page with absolute positioning before the print dialog opens.
	const root = deps.printRoot;
	root.style.position = "absolute";
	root.style.left = "0";
	root.style.top = "0";
	root.style.opacity = "1";
	root.style.pointerEvents = "none";
	root.style.zIndex = "1";
	document.documentElement.classList.add("is-printing");
}

function cleanupPrint(deps: PrintDeps) {
	document.documentElement.classList.remove("is-printing");
	try {
		clearPageSize();
	} catch {}
	const root = deps.printRoot;
	// Restore offscreen "warm" placement used between prints.
	root.style.position = "";
	root.style.left = "";
	root.style.top = "";
	root.style.opacity = "";
	root.style.pointerEvents = "";
	root.style.zIndex = "";
}

export function createPrintNow(deps: PrintDeps) {
	let printing = false;

	window.addEventListener("beforeprint", () => {
		preparePrint(deps, deps.getSnapshot());
	});
	window.addEventListener("afterprint", () => {
		cleanupPrint(deps);
	});

	return function printNow() {
		if (printing) return;
		printing = true;

		const snapshot = deps.getSnapshot();
		const sx = window.scrollX;
		const sy = window.scrollY;

		preparePrint(deps, snapshot);
		window.print();

		window.setTimeout(() => {
			cleanupPrint(deps);
		}, 1500);
		window.setTimeout(() => window.scrollTo(sx, sy), 0);

		// afterprint is unreliable on iOS; reset gate after a short delay.
		window.setTimeout(() => {
			printing = false;
		}, 800);
	};
}
