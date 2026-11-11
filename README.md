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

## Reporte compartido

El juego puede publicar las partidas completadas en Supabase para que el reporte sea común a todos los dispositivos. Para configurarlo:

1. Crea un proyecto en Supabase y ejecuta [`supabase/schema.sql`](./supabase/schema.sql) en el SQL Editor. Si la tabla ya existe, el script agrega las columnas que falten sin borrar partidas.
2. Copia [`.env.example`](./.env.example) a `.env.local` y reemplaza los valores con la URL del proyecto y la clave pública `anon`/publishable de Supabase.
3. Ejecuta `npm run dev` de nuevo después de configurar las variables. Para producción, configura las mismas variables en el servicio que compila y publica la aplicación.

La clave pública se incluye en el frontend; nunca uses la clave `service_role`. La tabla permite lecturas e inserciones públicas para cumplir con el reporte compartido. No hay autenticación, por lo que cualquier visitante puede enviar resultados y los datos no deben considerarse verificados.

Las partidas nuevas se guardan localmente y se publican en Supabase al terminar cada partida, incluidas las opciones que cada jugador eligió en cada pregunta. El reporte compartido solo muestra los datos que logra leer de Supabase; **Actualizar** vuelve a consultarlos y nunca vuelve a subir el historial local, para evitar que partidas borradas reaparezcan. El historial local anterior no se importa automáticamente. El reporte incluye filtros por fecha y jugador y gráficos de partidas y respuestas colaborativas. Los nombres repetidos están permitidos, pero no se aceptan números; las estadísticas de la tabla se agrupan por nombre. **Descargar Excel** genera un libro `.xlsx` con hojas de partidas y resumen por jugador.

Si no configuras Supabase, el juego sigue funcionando con almacenamiento local y el reporte solo estará disponible en ese navegador. El archivo Excel permite conservar una copia externa.