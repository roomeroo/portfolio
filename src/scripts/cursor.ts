const isFinePointer = window.matchMedia(
	'(hover: hover) and (pointer: fine)'
).matches;

if (isFinePointer) {
	const cursorDot = document.getElementById('cursor-dot');
	const trailDot = document.getElementById('cursor-trail');

	if (cursorDot && trailDot) {
		const root = document.documentElement;
		const trail: HTMLElement = trailDot;
		const reducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		);

		root.classList.add('custom-cursor');

		// Fracción de la distancia que la estela recorre cada 16,67 ms (60 fps).
		// Con 1 la estela sigue al puntero sin retraso.
		const FOLLOW = 0.22;
		const FRAME_MS = 1000 / 60;

		let cx = 0;
		let cy = 0;
		let tx = 0;
		let ty = 0;
		let lastTime = 0;
		let rafId = 0;

		function animate(time: number) {
			// Ajustamos por el tiempo real entre frames para que la estela
			// vaya igual en pantallas de 60, 120 o 144 Hz.
			const dt = lastTime ? Math.min(time - lastTime, 100) : FRAME_MS;
			lastTime = time;

			const follow = reducedMotion.matches
				? 1
				: 1 - Math.pow(1 - FOLLOW, dt / FRAME_MS);

			tx += (cx - tx) * follow;
			ty += (cy - ty) * follow;

			trail.style.left = tx + 'px';
			trail.style.top = ty + 'px';

			// Cuando la estela alcanza al puntero paramos el bucle;
			// el siguiente mousemove lo vuelve a arrancar.
			if (Math.abs(cx - tx) < 0.1 && Math.abs(cy - ty) < 0.1) {
				rafId = 0;
				lastTime = 0;
				return;
			}

			rafId = requestAnimationFrame(animate);
		}

		window.addEventListener('mousemove', (e) => {
			cx = e.clientX;
			cy = e.clientY;

			cursorDot.style.left = cx + 'px';
			cursorDot.style.top = cy + 'px';

			if (!rafId) {
				rafId = requestAnimationFrame(animate);
			}
		});

		// Estado hover: el cursor crece sobre elementos interactivos.
		const INTERACTIVE = 'a, button, [role="button"], summary';

		document.addEventListener('mouseover', (e) => {
			const target = e.target;

			if (target instanceof Element && target.closest(INTERACTIVE)) {
				root.classList.add('cursor-hover');
			}
		});

		document.addEventListener('mouseout', (e) => {
			const target = e.target;
			const next = e.relatedTarget;

			if (
				target instanceof Element &&
				target.closest(INTERACTIVE) &&
				!(next instanceof Element && next.closest(INTERACTIVE))
			) {
				root.classList.remove('cursor-hover');
			}
		});
	}
}
