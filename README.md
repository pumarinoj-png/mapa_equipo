# Mapa de equipo

Aplicación web para que los líderes mapeen a las personas de su equipo: SCARF, estilo DISC, fortalezas, áreas de desarrollo, tareas en las que rinden mejor, motivación y variables propias. Con eso se arma un mapa del equipo, una vista de sistema solar y un asesor de IA.

No tiene marca de ningún cliente, así que sirve para varias empresas: cada líder indica su empresa al ingresar, y el panel de administración las separa.

Es un sitio estático (HTML, CSS y JavaScript) más funciones de servidor en `api/`. Las funciones de IA y el registro para administración son **opcionales**: sin configurarlos, la app funciona igual y todo queda en el navegador de cada líder.

## Estructura del repositorio

```
index.html        Aplicación de los líderes
app.js            Lógica, preguntas y vistas
styles.css        Diseño y colores
admin.html        Panel de administración
admin.js          Lógica del panel
package.json      Versión de Node
vercel.json       Cabeceras de seguridad, no indexación y tiempo máximo de las funciones
README.md
.gitignore
api/
  ask.js          Entrevista con IA sobre una variable propia
  advise.js       Asesor IA para gestionar el equipo
  sync.js         Recibe el registro que envían los líderes
  admin.js        Entrega los datos al panel de administración
lib/
  shared.js       Código compartido por las funciones
```

Sube el **contenido** de la carpeta, de modo que `index.html` quede en la raíz del repositorio.

## Qué ve el líder

1. **Ingreso:** indica su empresa (obligatoria), su nombre, un correo opcional y el nombre de su equipo.
2. **Mi equipo:** agrega personas y completa 6 secciones por cada una (Perfil, SCARF, DISC, Fortalezas, Tareas, Gestión) más una séptima opcional, **Variables propias**. Todo se guarda solo y puede volver cuando quiera.
3. **Perfil de cada persona:** DISC, gráfico SCARF, fortalezas, tareas y sugerencias de cómo liderarla.
4. **Mapa del equipo, pestaña Análisis:** mapa de calor SCARF, estilos DISC, matriz de habilidad y motivación, fortalezas y áreas de desarrollo con las personas bajo cada una, y cobertura de tareas.
5. **Mapa del equipo, pestaña Sistema solar:** imagen estática. El líder es el sol y cada persona un planeta con su órbita. Más cerca del sol significa más motivación, más grande significa más habilidad, y el color y la letra dentro del planeta indican el estilo DISC (D, I, S, C). Un círculo rojo con "!" marca una alerta (necesidad SCARF vivida como amenaza o riesgo de fuga alto). Al pasar el cursor sobre un planeta se despliega su resumen, y al hacer clic se abre su perfil. En el celular, un toque muestra el resumen debajo de la imagen. Se puede descargar como imagen PNG, con leyenda incluida.
6. **Asesor IA:** el líder pregunta cómo gestionar su equipo y la IA responde con base en los perfiles ingresados.
7. **Respaldo:** descargar o restaurar los datos, y gestionar el registro con administración.
8. **Salir:** botón en la barra superior. Ofrece descargar un respaldo y luego borra todos los datos de ese navegador y vuelve al inicio. No elimina la copia que ya se haya enviado a administración.

## Publicar en Vercel

1. Sube los archivos a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com), elige **Add New > Project** e importa el repositorio.
3. En *Framework Preset* deja **Other**. No hay comando de build ni carpeta de salida.
4. Presiona **Deploy**. Con eso la app ya funciona, sin IA ni registro.
5. Para activar la IA y el registro, configura las variables de entorno de abajo (Project > Settings > Environment Variables) y **vuelve a desplegar**: las variables solo se aplican en despliegues nuevos.

## Variables de entorno

| Variable | Para qué | Obligatoria |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Activa las variables propias con IA y el Asesor IA. Se crea en console.anthropic.com. | Para la IA |
| `ACCESS_CODE` | Código que los líderes ingresan una vez para usar la IA y el registro. Evita que cualquiera con el link gaste crédito. | Recomendada |
| `ANTHROPIC_MODEL` | Modelo a usar. Por defecto `claude-sonnet-5-5`. Uno más pequeño sale más barato. | No |
| `KV_REST_API_URL` y `KV_REST_API_TOKEN` | Base de datos Redis del registro (o `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`). | Para el registro |
| `ADMIN_CODE` | Código para entrar a `/admin.html`. | Para el registro |
| `SYNC_LEVEL` | `full` (por defecto) o `activity`. Ver más abajo. | No |
| `SYNC_REQUIRED` | `true` para que el envío al registro sea automático y obligatorio. | No |

## IA: qué sale del navegador

- **Variables propias:** se envía el primer nombre de la persona, su cargo, la variable y las respuestas del líder en esa conversación.
- **Asesor IA:** se envía un resumen de los perfiles del equipo. Por defecto los nombres se reemplazan por "Persona 1", "Persona 2"… antes de salir del navegador y se traducen de vuelta al mostrar la respuesta. Las notas escritas del líder solo se incluyen si él lo activa.
- La empresa del líder **no** se envía a la IA.

Antes de habilitarla, conviene revisar con Legal o TI la política del cliente sobre enviar datos de personas a proveedores de IA. Cada conversación consume crédito de la API.

## Registro para administración

Sin configurar, los datos viven solo en el navegador de cada líder. Para tener un registro central y poder ver los resultados de cada líder:

1. En Vercel, en **Storage**, crea una base de datos **Upstash for Redis** (Marketplace) y conéctala al proyecto. Esto agrega las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`; verifica en Environment Variables que existan.
2. Agrega `ADMIN_CODE` y vuelve a desplegar.
3. Entra a `tu-dominio.vercel.app/admin.html` con ese código.

Cuando el registro está habilitado, aparece una sección en **Respaldo** donde el líder ve qué se envía y puede enviar manualmente o activar el envío automático. Con `SYNC_REQUIRED=true` el envío es automático y se le avisa desde la pantalla de bienvenida. Sin esa variable, solo aparecen en el panel los líderes que activan o hacen el envío.

### Qué ves como administrador

- **Lista de líderes** con empresa, equipo, personas mapeadas, avance, uso de la IA y fecha del último envío. Puedes filtrar por empresa, y hay un resumen por empresa.
- **Ver resultados:** abre la app en modo solo lectura con todo lo que respondió el líder: personas, perfiles, notas, mapa, sistema solar, preguntas y respuestas de las variables con IA, y su historial con el asesor. No se puede editar, y tus propios datos locales no se tocan.
- **Resumen**, descarga de la copia en JSON, CSV de la lista, bitácora de movimientos y botón para eliminar el registro de un líder.

### Nivel del registro (`SYNC_LEVEL`)

- `full` (por defecto): copia completa de lo que el líder ingresó. Es lo que permite "Ver resultados".
- `activity`: solo actividad (cuántas personas, avance, uso de la IA). No se guardan nombres, respuestas, notas ni conversaciones. Lo impone el servidor, aunque el navegador enviara más.

### Antes de usar el nivel `full` con un cliente

Se guarda de forma central información personal y evaluaciones subjetivas de terceros (las personas mapeadas), que no necesariamente saben que están en esta herramienta. Conviene acordar con cada cliente, junto a Legal y RR.HH.: la base legal y la finalidad, quién puede ver los datos y por cuánto tiempo, cómo se informa a las personas mapeadas y cómo se atienden solicitudes de acceso o eliminación. El panel permite eliminar el registro de un líder del servidor.

## Varios clientes

Con un solo despliegue, todas las empresas comparten la misma base de datos, `ACCESS_CODE` y `ADMIN_CODE`, y el panel las separa por el campo Empresa. Si algún cliente exige aislamiento de sus datos o un código propio, crea un proyecto de Vercel aparte para él (mismo repositorio, sus propias variables de entorno y su propia base de datos).

## Cómo personalizar

El contenido editable está al inicio de `app.js`, en **Contenido**: textos y consejos SCARF, frases DISC, y las listas de competencias, tareas y motivadores. Los colores y tipografías están en las variables de `:root` de `styles.css` (`--brand`, `--brand-d` y `--brand-l` para el color principal).

## Probar en tu computador

La app estática se abre con cualquier servidor local. Para probar también las funciones de `api/`, instala la CLI de Vercel y ejecuta `vercel dev` en la carpeta, con las variables en un archivo `.env` (ya está en `.gitignore`).

## Uso responsable

La herramienta refleja la percepción del líder. No es un test psicométrico validado ni debe usarse para evaluar formalmente, contratar, sancionar o despedir. Se recomienda comunicarlo a los líderes al compartir el link.
