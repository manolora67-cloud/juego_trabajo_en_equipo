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

1. Crea un proyecto en Supabase y ejecuta [`supabase/schema.sql`](./supabase/schema.sql) en el SQL Editor.
2. Copia [`.env.example`](./.env.example) a `.env.local` y reemplaza los valores con la URL del proyecto y la clave pública `anon`/publishable de Supabase.
3. Ejecuta `npm run dev` de nuevo después de configurar las variables. Para producción, configura las mismas variables en el servicio que compila y publica la aplicación.

La clave pública se incluye en el frontend; nunca uses la clave `service_role`. La tabla permite lecturas e inserciones públicas para cumplir con el reporte compartido. No hay autenticación, por lo que cualquier visitante puede enviar resultados y los datos no deben considerarse verificados.

Las partidas antiguas guardadas localmente se importan al reporte cuando se abre o actualiza desde ese navegador. Cada dispositivo que tenga historial previo debe conectarse una vez para importar sus partidas. El botón **Actualizar** vuelve a consultar el reporte público; los nombres repetidos están permitidos y las estadísticas de la tabla se agrupan por nombre.

Si no configuras Supabase, el juego sigue funcionando con almacenamiento local y el reporte solo estará disponible en ese navegador. El CSV permite conservar una copia externa.