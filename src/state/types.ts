export type Orientation = "portrait" | "landscape";
export type Align = "left" | "center" | "right";

export type LabelSettings = {
	widthIn: number;
	heightIn: number;
	paddingIn: number;
	orientation: Orientation;
	text: string;
	align: Align;
	cornerText: string;
};

export type RawFormState = {
	w: string;
	h: string;
	pad: string;
	orientation: Orientation;
	text: string;
	align: Align;
	cornerText: string;
};
