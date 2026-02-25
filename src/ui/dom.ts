export type Refs = {
	w: HTMLInputElement;
	h: HTMLInputElement;
	pad: HTMLInputElement;
	txt: HTMLTextAreaElement;
	cornerTxt: HTMLInputElement;

	previewInner: HTMLDivElement;
	previewRotator: HTMLDivElement;
	previewCornerSpan: HTMLSpanElement;
	previewCornerSpacer: HTMLDivElement;
	previewMainArea: HTMLDivElement;
	previewSpan: HTMLSpanElement;

	printBtn: HTMLButtonElement;
	clearBtn: HTMLButtonElement;
	portraitBtn: HTMLButtonElement;
	landscapeBtn: HTMLButtonElement;

	sizeBtn: HTMLButtonElement;
	modal: HTMLDivElement;
	okModalBtn: HTMLButtonElement;
	cancelModalBtn: HTMLButtonElement;
	presetBtns: HTMLButtonElement[];

	overflowWarn: HTMLDivElement;

	overlay: HTMLDivElement;
	printRoot: HTMLDivElement;
	buildSha: HTMLDivElement;
};

function req<T extends HTMLElement>(id: string): T {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Missing required element #${id}`);
	return el as T;
}

export function getRefs(): Refs {
	return {
		w: req<HTMLInputElement>("w"),
		h: req<HTMLInputElement>("h"),
		pad: req<HTMLInputElement>("pad"),
		txt: req<HTMLTextAreaElement>("txt"),
		cornerTxt: req<HTMLInputElement>("cornerTxt"),

		previewInner: req<HTMLDivElement>("previewInner"),
		previewRotator: req<HTMLDivElement>("previewRotator"),
		previewCornerSpan: req<HTMLSpanElement>("previewCornerSpan"),
		previewCornerSpacer: req<HTMLDivElement>("previewCornerSpacer"),
		previewMainArea: req<HTMLDivElement>("previewMainArea"),
		previewSpan: req<HTMLSpanElement>("previewSpan"),

		printBtn: req<HTMLButtonElement>("printBtn"),
		clearBtn: req<HTMLButtonElement>("clearBtn"),
		portraitBtn: req<HTMLButtonElement>("portraitBtn"),
		landscapeBtn: req<HTMLButtonElement>("landscapeBtn"),

		sizeBtn: req<HTMLButtonElement>("sizeBtn"),
		modal: req<HTMLDivElement>("sizeModal"),
		okModalBtn: req<HTMLButtonElement>("okModalBtn"),
		cancelModalBtn: req<HTMLButtonElement>("cancelModalBtn"),
		presetBtns: Array.from(
			document.querySelectorAll<HTMLButtonElement>(".presetBtn"),
		),

		overflowWarn: req<HTMLDivElement>("overflowWarn"),

		overlay: req<HTMLDivElement>("printOverlay"),
		printRoot: req<HTMLDivElement>("printRoot"),
		buildSha: req<HTMLDivElement>("buildSha"),
	};
}
