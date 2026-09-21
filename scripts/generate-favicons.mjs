// Genera los favicons de public/ a partir del monograma original (src/assets/logo-ar.png).
// Uso: npm run favicons
//
// Recorta el monograma, lo pinta con el color de fondo del sitio sobre el verde
// acento y engrosa un poco el trazo en los tamaños pequeños para que se lea.
import sharp from 'sharp';

const SOURCE = 'src/assets/logo-ar.png';
const OUT_DIR = 'public';
const BG = '#D7FC40'; // --color-accent
const FG = '#161513'; // --color-background

// fill: fracción del icono que ocupa el monograma
// radius: esquinas redondeadas (0 en apple-touch-icon: iOS ya las redondea)
// thicken: píxeles que se engrosa el trazo por cada lado (0 = sin engrosar)
const SIZES = [
	{ size: 512, fill: 0.66, radius: 0.22, thicken: 0 },
	{ size: 192, fill: 0.66, radius: 0.22, thicken: 0 },
	{ size: 180, fill: 0.66, radius: 0, thicken: 0 },
	{ size: 48, fill: 0.8, radius: 0.2, thicken: 0.25 },
	{ size: 32, fill: 0.86, radius: 0.18, thicken: 0.4 },
	{ size: 16, fill: 0.88, radius: 0.15, thicken: 0.6 },
];

// Máscara cuadrada del monograma (blanco = trazo). El negro del original no es
// negro puro, así que se estira el contraste para no dejar un halo de fondo.
async function loadMask() {
	const { data, info } = await sharp(SOURCE)
		.greyscale()
		.raw()
		.toBuffer({ resolveWithObject: true });

	let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
	for (let y = 0; y < info.height; y++) {
		for (let x = 0; x < info.width; x++) {
			if (data[y * info.width + x] > 128) {
				x0 = Math.min(x0, x);
				x1 = Math.max(x1, x);
				y0 = Math.min(y0, y);
				y1 = Math.max(y1, y);
			}
		}
	}

	const w = x1 - x0 + 1;
	const h = y1 - y0 + 1;
	const side = Math.max(w, h);

	const crop = await sharp(SOURCE)
		.greyscale()
		.extract({ left: x0, top: y0, width: w, height: h })
		.png()
		.toBuffer();

	return sharp({ create: { width: side, height: side, channels: 3, background: '#000' } })
		.composite([
			{ input: crop, left: Math.round((side - w) / 2), top: Math.round((side - h) / 2) },
		])
		.greyscale()
		.linear(255 / (200 - 60), (-60 * 255) / (200 - 60))
		.png()
		.toBuffer();
}

async function makeIcon(mask, { size, fill, radius, thicken }) {
	const g = Math.round(size * fill);

	// sharp aplica siempre resize -> blur -> threshold, sin importar el orden
	// en que se encadenen, así que cada paso va en su propia llamada.
	let big = await sharp(mask).resize(g * 4, g * 4, { kernel: 'lanczos3' }).toBuffer();

	if (thicken) {
		// Desenfoque + umbral bajo = dilatación del trazo.
		big = await sharp(big)
			.blur(Math.max(0.3, thicken * 4 * 1.5))
			.threshold(64)
			.toBuffer();
	}

	const alpha = await sharp(big)
		.resize(g, g, { kernel: 'lanczos3' })
		.greyscale()
		.raw()
		.toBuffer();

	const glyph = await sharp({ create: { width: g, height: g, channels: 3, background: FG } })
		.joinChannel(alpha, { raw: { width: g, height: g, channels: 1 } })
		.png()
		.toBuffer();

	const background = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
			`<rect width="${size}" height="${size}" rx="${Math.round(size * radius)}" fill="${BG}"/></svg>`
	);

	const offset = Math.round((size - g) / 2);

	await sharp(background)
		.composite([{ input: glyph, left: offset, top: offset }])
		.png()
		.toFile(`${OUT_DIR}/favicon-${size}x${size}.png`);

	console.log(`favicon-${size}x${size}.png`);
}

const mask = await loadMask();

for (const config of SIZES) {
	await makeIcon(mask, config);
}
