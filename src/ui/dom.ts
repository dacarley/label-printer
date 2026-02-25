export type Refs = {
	w: HTMLInputElement;
	h: HTMLInputElement;
	pad: HTMLInputElement;
	txt: HTMLTextAreaElement;

	previewInner: HTMLDivElement;
	previewRotator: HTMLDivElement;
	previewSpan: HTMLSpanElement;

	printBtn: HTMLButtonElement;
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

		previewInner: req<HTMLDivElement>("previewInner"),
		previewRotator: req<HTMLDivElement>("previewRotator"),
		previewSpan: req<HTMLSpanElement>("previewSpan"),

		printBtn: req<HTMLButtonElement>("printBtn"),
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
	};
}
