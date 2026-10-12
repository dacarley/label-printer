import { bestFitFont } from "./layout/fitText";
import { createPrintNow } from "./print/printNow";
import {
	applyCenteredMain,
	setCornerText,
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

const DEFAULT_W = "4";
const DEFAULT_H = "6";
const DEFAULT_PAD = "0.2";

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

	const defaults: RawFormState = {
		w: DEFAULT_W,
		h: DEFAULT_H,
		pad: DEFAULT_PAD,
		orientation: "portrait",
		text: "",
		align: "center",
		cornerText: "",
	};

	const saved = loadSettings();
	const initial: RawFormState = {
		...defaults,
		...saved,
	};

	els.w.value = String(initial.w);
	els.h.value = String(initial.h);
	els.pad.value = String(initial.pad);
	els.txt.value = String(initial.text);
	els.cornerTxt.value = String(initial.cornerText ?? "");

	let orientation: Orientation =
		initial.orientation === "landscape" ? "landscape" : "portrait";

	/** Size fields at modal open; restored on Cancel / Esc / backdrop. */
	let sizeModalSnapshot: { w: string; h: string; pad: string } | null = null;

	function getRaw(): RawFormState {
		return {
			w: els.w.value,
			h: els.h.value,
			pad: els.pad.value,
			orientation,
			text: els.txt.value,
			align: "center",
			cornerText: els.cornerTxt.value,
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

	function syncSizeFieldsFromNormalized() {
		const s = normalizeSettings(getRaw());
		els.w.value = String(s.widthIn);
		els.h.value = String(s.heightIn);
		els.pad.value = String(s.paddingIn);
		return s;
	}

	function isLabelEmpty() {
		return !els.txt.value.trim() && !els.cornerTxt.value.trim();
	}

	function setPrintMsg(msg: string | null) {
		if (!msg) {
			hide(els.printMsg);
			els.printMsg.textContent = "";
			return;
		}
		els.printMsg.textContent = msg;
		show(els.printMsg);
	}

	function updateAll() {
		const s = normalizeSettings(getRaw());

		setCSSVars(s);
		applyCenteredMain(els.previewSpan, els.previewMainArea);
		setRotation(els.previewRotator, s.orientation);
		setPreviewText(els.previewSpan, s.text);
		setCornerText(
			els.previewCornerSpan,
			s.cornerText,
			els.previewCornerSpacer,
			els.previewRotator,
		);

		const fit = bestFitFont(
			els.previewSpan,
			els.previewMainArea,
			"px",
			6,
			1200,
		);
		if (!fit.minFits) show(els.overflowWarn);
		else hide(els.overflowWarn);

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
			els.cornerTxt.blur();
		} catch {}
	}

	const printNow = createPrintNow({
		printRoot: els.printRoot,
		getSnapshot: () => normalizeSettings(getRaw()),
		blur: blurAll,
	});

	function openSizeModal() {
		sizeModalSnapshot = {
			w: els.w.value,
			h: els.h.value,
			pad: els.pad.value,
		};
		openModal(els.modal);
	}

	function cancelSizeModal() {
		if (sizeModalSnapshot) {
			els.w.value = sizeModalSnapshot.w;
			els.h.value = sizeModalSnapshot.h;
			els.pad.value = sizeModalSnapshot.pad;
			sizeModalSnapshot = null;
			autosizeTextarea(els.txt);
			updateAll();
			save();
		}
		closeModal(els.modal);
	}

	function commitSizeModal() {
		sizeModalSnapshot = null;
		syncSizeFieldsFromNormalized();
		autosizeTextarea(els.txt);
		updateAll();
		save();
		closeModal(els.modal);
	}

	els.sizeBtn.addEventListener("click", () => openSizeModal());
	els.cancelModalBtn.addEventListener("click", () => cancelSizeModal());
	els.okModalBtn.addEventListener("click", () => commitSizeModal());

	els.modal.addEventListener("click", (e) => {
		const t = e.target as HTMLElement;
		if (t?.classList?.contains("modalBackdrop")) cancelSizeModal();
	});

	for (const b of els.presetBtns) {
		b.addEventListener("click", () => {
			const w = b.getAttribute("data-w");
			const h = b.getAttribute("data-h");
			const pad = b.getAttribute("data-pad");
			if (w) els.w.value = w;
			if (h) els.h.value = h;
			if (pad) els.pad.value = pad;
			sizeModalSnapshot = null;
			syncSizeFieldsFromNormalized();
			autosizeTextarea(els.txt);
			updateAll();
			save();
			closeModal(els.modal);
		});
	}

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

	els.clearBtn.addEventListener("click", () => {
		els.txt.value = "";
		els.cornerTxt.value = "";
		els.w.value = DEFAULT_W;
		els.h.value = DEFAULT_H;
		els.pad.value = DEFAULT_PAD;
		orientation = "portrait";
		applyOrientationButtonState();
		setPrintMsg(null);
		autosizeTextarea(els.txt);
		updateAll();
		save();
	});

	els.printBtn.addEventListener("click", () => {
		autosizeTextarea(els.txt);
		const s = updateAll();
		save();

		if (isLabelEmpty()) {
			setPrintMsg("Nothing to print.");
			return;
		}
		setPrintMsg(null);

		const overflowing = els.overflowWarn.style.display !== "none";
		if (overflowing) {
			const ok = window.confirm(
				"This text can't fit on the label. Print anyway?",
			);
			if (!ok) return;
		}

		// Keep print() synchronous in this gesture (after confirm).
		printNow();
	});

	const onInput = () => {
		if (!isLabelEmpty()) setPrintMsg(null);
		autosizeTextarea(els.txt);
		updateAll();
		save();
	};

	els.w.addEventListener("input", onInput);
	els.h.addEventListener("input", onInput);
	els.pad.addEventListener("input", onInput);
	els.txt.addEventListener("input", onInput);
	els.cornerTxt.addEventListener("input", onInput);

	const onSizeBlur = () => {
		syncSizeFieldsFromNormalized();
		updateAll();
		save();
	};
	els.w.addEventListener("blur", onSizeBlur);
	els.h.addEventListener("blur", onSizeBlur);
	els.pad.addEventListener("blur", onSizeBlur);

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

	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && els.modal.classList.contains("open"))
			cancelSizeModal();
	});

	applyOrientationButtonState();
	autosizeTextarea(els.txt);
	updateAll();
	closeModal(els.modal);
}
