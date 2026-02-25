export type Unit = "px" | "pt";

export type FitResult = {
  best: number;
  minFits: boolean;
};

export function measureFits(spanEl: HTMLElement, containerEl: HTMLElement, size: number, unit: Unit) {
  spanEl.style.fontSize = `${size}${unit}`;
  const s = spanEl.getBoundingClientRect();
  const c = containerEl.getBoundingClientRect();
  return s.width <= c.width && s.height <= c.height;
}

/**
 * Binary-search the largest font size (in px or pt) that still fits.
 * IMPORTANT: If the container uses CSS transforms (rotation), bounding boxes already reflect that.
 */
export function bestFitFont(spanEl: HTMLElement, containerEl: HTMLElement, unit: Unit, min: number, max: number): FitResult {
  let lo = min;
  let hi = max;
  let best = min;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (measureFits(spanEl, containerEl, mid, unit)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  spanEl.style.fontSize = `${best}${unit}`;
  const minFits = measureFits(spanEl, containerEl, min, unit);
  spanEl.style.fontSize = `${best}${unit}`;
  return { best, minFits };
}
