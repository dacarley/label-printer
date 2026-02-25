import { renderPrintRoot } from "../render/printRoot";
import type { LabelSettings } from "../state/types";
import { clearPageSize, setPageSizeInches } from "./pageStyle";

export type PrintDeps = {
	printRoot: HTMLDivElement;
	getSnapshot: () => LabelSettings; // must return normalized settings
	blur: () => void;
};

export function createPrintNow(deps: PrintDeps) {
	let printing = false;

	return function printNow() {
		if (printing) return;
		printing = true;

		const snapshot = deps.getSnapshot();

		// Ensure print DOM is fully up-to-date synchronously inside the user gesture.
		try {
			renderPrintRoot(deps.printRoot, snapshot);
		} catch {}

		// Avoid iOS zoom/resize weirdness caused by focused inputs during print.
		deps.blur();

		// Preserve scroll (print UI can cause a jump)
		const sx = window.scrollX;
		const sy = window.scrollY;

		setPageSizeInches(snapshot.widthIn, snapshot.heightIn);
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
