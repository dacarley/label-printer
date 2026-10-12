import { renderPrintRoot } from "../render/printRoot";
import type { LabelSettings } from "../state/types";
import { clearPageSize, setPageSizeInches } from "./pageStyle";

export type PrintDeps = {
	printRoot: HTMLDivElement;
	getSnapshot: () => LabelSettings; // must return normalized settings
	blur: () => void;
};

function preparePrint(deps: PrintDeps, snapshot: LabelSettings) {
	try {
		renderPrintRoot(deps.printRoot, snapshot);
	} catch {}
	deps.blur();
	setPageSizeInches(snapshot.widthIn, snapshot.heightIn);
}

export function createPrintNow(deps: PrintDeps) {
	let printing = false;

	// Ctrl+P / system print still need @page size + warm print DOM.
	window.addEventListener("beforeprint", () => {
		preparePrint(deps, deps.getSnapshot());
	});
	window.addEventListener("afterprint", () => {
		try {
			clearPageSize();
		} catch {}
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
			try {
				clearPageSize();
			} catch {}
		}, 1500);
		window.setTimeout(() => window.scrollTo(sx, sy), 0);

		// afterprint is unreliable on iOS; reset gate after a short delay.
		window.setTimeout(() => {
			printing = false;
		}, 800);
	};
}
