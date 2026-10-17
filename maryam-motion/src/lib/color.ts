/** Accepts '#rrggbb' or 'rgb(r,g,b)' so mixes can be chained. */
const toRgb = (color: string) => {
	if (color.startsWith('rgb')) return color.replace(/[^\d,]/g, '').split(',').slice(0, 3).map(Number);
	const h = color.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/** Mix two hex colours, p = 0 → a, p = 1 → b. */
export const mix = (a: string, b: string, p: number) => {
	const A = toRgb(a);
	const B = toRgb(b);
	const c = A.map((x, i) => Math.round(x + (B[i] - x) * p));
	return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const rgba = (hex: string, alpha: number) => {
	const [r, g, b] = toRgb(hex);
	return `rgba(${r},${g},${b},${alpha})`;
};
