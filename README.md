# Portfolio Adrián Romero

Portfolio personal hecho con [Astro](https://astro.build) y [Tailwind CSS 4](https://tailwindcss.com).

## Requisitos

- Node.js >= 22.12.0

## Comandos

| Comando           | Acción                                          |
| :---------------- | :---------------------------------------------- |
| `npm install`     | Instala las dependencias                        |
| `npm run start`   | Arranca el servidor de desarrollo               |
| `npm run check`   | Comprueba tipos y errores con `astro check`     |
| `npm run build`   | Genera el sitio estático en `./dist/`           |
| `npm run preview` | Sirve el build en local antes de desplegar      |
| `npm run favicons`| Regenera los favicons de `public/` desde el logo |

## Estructura

```text
src/
├── components/   Componentes Astro (Marquee, StatusPanel, Cursor)
├── data/         Contenido en TypeScript (items del marquee)
├── assets/       Foto y logo original (logo-ar.png, origen de los favicons)
├── layouts/      BaseLayout: <head>, metadatos y <body>
├── pages/        Rutas (index.astro)
├── scripts/      JS del cliente (cursor personalizado, scramble del nombre)
└── styles/       global.css: tema de Tailwind, fuentes y cursor
scripts/          generate-favicons.mjs (crea los favicons con sharp)
public/           Favicons generados
```
