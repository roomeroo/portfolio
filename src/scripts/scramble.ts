const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#';

function randomChar() {
	return SCRAMBLE_CHARS[
		Math.floor(Math.random() * SCRAMBLE_CHARS.length)
	];
}


// ============================================
// DIVIDIR EL NOMBRE EN LÍNEAS
// ============================================

function calculateLines(el: HTMLElement): string[] {
	const text = el.dataset.scramble?.trim() ?? '';

	if (!text) return [];

	const words = text.split(/\s+/);

	// Elemento invisible usado para medir con la misma
	// tipografía, tamaño y espaciado que el H1.
	const measurer = document.createElement('div');
	const computed = window.getComputedStyle(el);

	measurer.style.position = 'fixed';
	measurer.style.visibility = 'hidden';
	measurer.style.pointerEvents = 'none';
	measurer.style.whiteSpace = 'nowrap';
	measurer.style.width = 'max-content';

	measurer.style.fontFamily = computed.fontFamily;
	measurer.style.fontSize = computed.fontSize;
	measurer.style.fontWeight = computed.fontWeight;
	measurer.style.letterSpacing = computed.letterSpacing;
	measurer.style.lineHeight = computed.lineHeight;
	measurer.style.textTransform = computed.textTransform;

	document.body.appendChild(measurer);

	// A partir de `md` la foto se coloca a la derecha de la mitad del viewport,
	// así que cada línea puede ocupar como máximo el 50%. Por debajo de `md`
	// la foto va debajo del nombre y la línea puede usar todo el ancho del h1.
	// El tamaño de letra del h1 (index.astro) se calcula para que la palabra
	// más larga siempre quepa en ese límite y no haya que partirla.
	const photoBeside = window.matchMedia('(min-width: 48rem)').matches;
	const maxWidth = photoBeside
		? window.innerWidth * 0.5
		: el.getBoundingClientRect().width;

	const lines: string[] = [];
	let currentLine = '';

	function measure(value: string) {
		measurer.textContent = value;
		return measurer.getBoundingClientRect().width;
	}

	for (const word of words) {
		const candidate = currentLine
			? `${currentLine} ${word}`
			: word;

		if (measure(candidate) <= maxWidth) {
			currentLine = candidate;
			continue;
		}

		// La palabra no cabe con la anterior.
		// Si cabe sola, empezamos una línea nueva.
		if (measure(word) <= maxWidth) {
			if (currentLine) {
				lines.push(currentLine);
			}

			currentLine = word;
			continue;
		}

		// Si incluso la palabra sola supera el 50%,
		// la dividimos por caracteres.
		if (currentLine) {
			lines.push(currentLine);
			currentLine = '';
		}

		let currentWord = '';

		for (const char of word) {
			const candidateChar = currentWord + char;

			if (measure(candidateChar) <= maxWidth) {
				currentWord = candidateChar;
			} else {
				if (currentWord) {
					lines.push(currentWord);
				}

				currentWord = char;
			}
		}

		if (currentWord) {
			currentLine = currentWord;
		}
	}

	if (currentLine) {
		lines.push(currentLine);
	}

	measurer.remove();

	return lines;
}


function prefersReducedMotion() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}


// ============================================
// RENDERIZAR LAS LÍNEAS
// ============================================

function renderLines(
	el: HTMLElement,
	animate = true
) {
	const lines = calculateLines(el);

	// Los <span> de cada línea se animan con caracteres aleatorios, así que
	// los ocultamos a los lectores de pantalla y damos el texto real al <h1>.
	el.setAttribute('aria-label', el.dataset.scramble?.trim() ?? '');

	// Primero dejamos el texto real en el DOM.
	// Así nunca hay un frame vacío durante un resize.
	el.innerHTML = '';

	for (const line of lines) {
		const lineElement = document.createElement('span');

		lineElement.className = 'block whitespace-nowrap';
		lineElement.setAttribute('aria-hidden', 'true');
		lineElement.dataset.scrambleLine = line;
		lineElement.textContent = line;

		el.appendChild(lineElement);
	}

	// Una vez que el DOM ya contiene las líneas,
	// arrancamos el scramble (salvo que el usuario prefiera menos movimiento).
	if (animate && !prefersReducedMotion()) {
		el.querySelectorAll<HTMLElement>(
			'[data-scramble-line]'
		).forEach(scrambleLine);
	}
}


// ============================================
// SCRAMBLE DE CADA LÍNEA
// ============================================

function scrambleLine(el: HTMLElement) {
	const finalText = el.dataset.scrambleLine ?? '';

	const revealFrame = Array.from(
		finalText,
		() => 8 + Math.floor(Math.random() * 24)
	);

	const maxFrame = Math.max(...revealFrame) + 8;

	let frame = 0;

	function tick() {
		let output = '';
		let doneCount = 0;

		for (let i = 0; i < finalText.length; i++) {
			const char = finalText[i];

			if (char === ' ') {
				output += ' ';
				doneCount++;
				continue;
			}

			if (frame >= revealFrame[i]) {
				output += char;
				doneCount++;
			} else {
				output += randomChar();
			}
		}

		el.textContent = output;

		frame++;

		if (
			doneCount < finalText.length &&
			frame <= maxFrame
		) {
			requestAnimationFrame(tick);
		} else {
			el.textContent = finalText;
		}
	}

	tick();
}


// ============================================
// INICIALIZAR
// ============================================

const heroNameEl = document.getElementById('hero-name');

if (heroNameEl instanceof HTMLElement) {
	// Const con tipo fijo: TypeScript pierde el narrowing dentro de closures.
	const heroName: HTMLElement = heroNameEl;

	function initHeroName() {
		renderLines(heroName, true);
	}

	// Esperamos a que carguen las fuentes.
	if ('fonts' in document) {
		document.fonts.ready.then(initHeroName);
	} else {
		initHeroName();
	}


	// --------------------------------------------
	// Recalcular cuando cambia el ancho.
	// --------------------------------------------
	// Solo el ancho importa (las líneas miden el 50% del viewport).
	// En móvil, la barra del navegador al hacer scroll dispara `resize`
	// cambiando solo el alto, y no queremos re-animar el nombre por eso.

	let resizeTimeout: number;
	let lastWidth = window.innerWidth;

	window.addEventListener('resize', () => {
		window.clearTimeout(resizeTimeout);

		resizeTimeout = window.setTimeout(() => {
			if (window.innerWidth === lastWidth) return;

			lastWidth = window.innerWidth;
			renderLines(heroName, true);
		}, 150);
	});
}
