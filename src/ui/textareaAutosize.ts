export function isStackedMode() {
  return window.matchMedia("(max-width: 899px)").matches;
}

export function autosizeTextarea(txtEl: HTMLTextAreaElement) {
  if (!isStackedMode()) {
    txtEl.style.height = "";
    txtEl.style.overflowY = "";
    return;
  }

  txtEl.style.height = "auto";
  const maxPx = Math.floor(window.innerHeight * 0.55);
  const target = Math.min(txtEl.scrollHeight + 2, maxPx);
  txtEl.style.height = `${target}px`;
  txtEl.style.overflowY = txtEl.scrollHeight + 2 > maxPx ? "auto" : "hidden";
}
