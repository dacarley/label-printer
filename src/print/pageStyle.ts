const STYLE_ID = "pageSizeStyle";

export function setPageSizeInches(wIn: number, hIn: number) {
  let st = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!st) {
    st = document.createElement("style");
    st.id = STYLE_ID;
    document.head.appendChild(st);
  }
  // @page doesn't reliably accept CSS vars, so use concrete values.
  st.textContent = `@page{ size: ${wIn}in ${hIn}in; margin:0; }`;
}

export function clearPageSize() {
  const st = document.getElementById(STYLE_ID);
  if (st) st.remove();
}
