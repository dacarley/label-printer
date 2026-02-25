import { bestFitFont } from "./layout/fitText";
import { createPrintNow } from "./print/printNow";
import {
	applyAlignment,
	setCSSVars,
	setPreviewText,
	setRotation,
} from "./render/preview";
import { renderPrintRoot } from "./render/printRoot";
import {
	loadSettings,
	normalizeSettings,
	saveSettingsDebounced,
} from "./state/settings";
import type { Orientation, RawFormState } from "./state/types";
import { getRefs } from "./ui/dom";
import { autosizeTextarea } from "./ui/textareaAutosize";

function show(el: HTMLElement) {
	el.style.display = "";
}
function hide(el: HTMLElement) {
	el.style.display = "none";
}

function openModal(modal: HTMLElement) {
	modal.classList.add("open");
	modal.setAttribute("aria-hidden", "false");
}
function closeModal(modal: HTMLElement) {
	modal.classList.remove("open");
	modal.setAttribute("aria-hidden", "true");
}

declare const __BUILD_SHA__: string;
declare const __BUILD_TIME__: string;

export function startApp() {
	const els = getRefs();

	const timeLabel = __BUILD_TIME__
		? new Date(__BUILD_TIME__).toLocaleString(undefined, {
				dateStyle: "short",
				timeStyle: "short",
			})
		: "";
	els.buildSha.textContent = ["sha:", __BUILD_SHA__, timeLabel]
		.filter(Boolean)
		.join(" · ");

	// Defaults (match your current behavior)
	const defaults: RawFormState = {
		w: "4",
		h: "6",
		pad: "0.2",
		orientation: "portrait",
		text: "",
		align: "center",
	};

	// Hydrate from storage
	const saved = loadSettings();
	const initial: RawFormState = {
		...defaults,
		...saved,
	};

	// Seed inputs
	els.w.value = String(initial.w);
	els.h.value = String(initial.h);
	els.pad.value = String(initial.pad);
	els.txt.value = String(initial.text);

	// Orientation buttons represent state; no select in current UI.
	let orientation: Orientation =
		initial.orientation === "landscape" ? "landscape" : "portrait";

	function getRaw(): RawFormState {
		return {
			w: els.w.value,
			h: els.h.value,
			pad: els.pad.value,
			orientation,
			text: els.txt.value,
			align: "center",
		};
	}

	const save = saveSettingsDebounced(getRaw);

	function applyOrientationButtonState() {
		els.portraitBtn.setAttribute(
			"aria-pressed",
			orientation === "portrait" ? "true" : "false",
		);
		els.landscapeBtn.setAttribute(
			"aria-pressed",
			orientation === "landscape" ? "true" : "false",
		);
	}

	function updateAll() {
		const s = normalizeSettings(getRaw());

		// Vars + preview layout
		setCSSVars(s);
		applyAlignment(els.previewSpan, els.previewRotator, s.align);
		setRotation(els.previewRotator, s.orientation);
		setPreviewText(els.previewSpan, s.text);

		// Fit preview text in px
		const fit = bestFitFont(els.previewSpan, els.previewInner, "px", 6, 1200);
		if (!fit.minFits) show(els.overflowWarn);
		else hide(els.overflowWarn);

		// Keep print DOM warm
		try {
			renderPrintRoot(els.printRoot, s);
		} catch {}

		return s;
	}

	function blurAll() {
		try {
			(document.activeElement as HTMLElement | null)?.blur();
		} catch {}
		try {
			els.txt.blur();
		} catch {}
		try {
			els.w.blur();
			els.h.blur();
			els.pad.blur();
		} catch {}
	}

	const printNow = createPrintNow({
		printRoot: els.printRoot,
		getSnapshot: () => normalizeSettings(getRaw()),
		blur: blurAll,
	});

	// Modal wiring
	els.sizeBtn.addEventListener("click", () => openModal(els.modal));
	els.cancelModalBtn.addEventListener("click", () => closeModal(els.modal));
	els.okModalBtn.addEventListener("click", () => {
		closeModal(els.modal);
		save();
	});

	// Click outside modal closes
	els.modal.addEventListener("click", (e) => {
		const t = e.target as HTMLElement;
		if (t?.classList?.contains("modalBackdrop")) closeModal(els.modal);
	});

	// Presets
	for (const b of els.presetBtns) {
		b.addEventListener("click", () => {
			const w = b.getAttribute("data-w");
			const h = b.getAttribute("data-h");
			const pad = b.getAttribute("data-pad");
			if (w) els.w.value = w;
			if (h) els.h.value = h;
			if (pad) els.pad.value = pad;
			autosizeTextarea(els.txt);
			updateAll();
			save();
			closeModal(els.modal);
		});
	}

	// Orientation buttons
	els.portraitBtn.addEventListener("click", () => {
		orientation = "portrait";
		applyOrientationButtonState();
		autosizeTextarea(els.txt);
		updateAll();
		save();
	});
	els.landscapeBtn.addEventListener("click", () => {
		orientation = "landscape";
		applyOrientationButtonState();
		autosizeTextarea(els.txt);
		updateAll();
		save();
	});

	// Print
	els.printBtn.addEventListener("click", () => {
		// Keep everything synchronous in this handler.
		autosizeTextarea(els.txt);
		updateAll();
		save();
		printNow();
	});

	// Inputs
	const onInput = () => {
		autosizeTextarea(els.txt);
		updateAll();
		save();
	};

	els.w.addEventListener("input", onInput);
	els.h.addEventListener("input", onInput);
	els.pad.addEventListener("input", onInput);
	els.txt.addEventListener("input", onInput);

	// Resize/orientation change (debounced)
	let resizeT: number | null = null;
	const onResize = () => {
		if (resizeT) window.clearTimeout(resizeT);
		resizeT = window.setTimeout(() => {
			autosizeTextarea(els.txt);
			updateAll();
		}, 50);
	};
	window.addEventListener("resize", onResize, { passive: true });
	window.addEventListener("orientationchange", onResize, { passive: true });

	// ESC closes modal
	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && els.modal.classList.contains("open"))
			closeModal(els.modal);
	});

	// Init
	applyOrientationButtonState();
	autosizeTextarea(els.txt);
	updateAll();
	// Ensure modal is hidden initially
	closeModal(els.modal);
}
