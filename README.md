# SENA Team Challenge

## Desarrollo local

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite, normalmente `http://localhost:5173/`.

## Five Server / Live Server

No abras el `index.html` de la raíz con Five Server: ese archivo usa TypeScript y necesita que Vite lo compile.

```bash
npm run build
```

Después abre `dist/index.html` con Five Server. El build usa rutas relativas para funcionar desde la carpeta `dist`.

Las partidas se guardan en el almacenamiento local del navegador. Usa siempre el mismo navegador y la misma dirección para consultar el historial; exporta el CSV para conservar una copia externa.