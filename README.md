# 🐹 Ratón Tama

**Un pequeño gran hogar para una mascota virtual que vive en tiempo real.**

Clon moderno y acogedor de Tamagotchi: cuidas a una criatura chibi en 3D estilo
juguete, la alimentas, la limpias, juegas con ella, la arropas al dormir y
observas cómo crece y evoluciona según tus cuidados. Al final de su vida deja
un huevo y empieza una nueva generación.

[![React 19](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-estricto-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite 7](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![R3F 9](https://img.shields.io/badge/@react--three/fiber-9.8-7b46c9)](https://docs.pmnd.rs)
[![Tailwind 4](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![GitHub Pages](https://img.shields.io/badge/despliegue-GitHub_Pages-222222?logo=github)](https://coiponorte.github.io/Raton-Tama/)

> **Jugar:** <https://coiponorte.github.io/Raton-Tama/>

---

## 🍙 Cómo se juega

Todo es visual: **naranja falta algo, rojo es urgente, verde está contento.**
No hay que leer párrafos ni contar números.

| Necesidad | Baja cada | Se cubre con | Icono |
| --- | --- | --- | --- |
| Hambre | ~2 h | Comida (onigiri, fresas, mochi…) | 🍙 |
| Ánimo | ~3 h | Jugar, minijuegos, caricias, mimos | 😊 |
| Energía | ciclo día/noche | Dormir y apagar la luz | 💤 |
| Higiene | al ensuciarse | Ducha y limpiar caca | 🫧 |
| Salud | si se descuida | Medicina de miel y descanso | 💊 |
| Vínculo | baja despacio | Constancia y mimos | 💗 |

1. Pulsa **¡Empezar!** — el reloj de la simulación solo arranca entonces.
2. Usa la barra de acciones de abajo: **Comer · Jugar · Limpiar · Dormir · Curar · Mimar**.
3. Con «Comer» se abre la despensa: **toca** para servir o **arrastra** la comida hasta su boquita.
4. Los cuidados activos se juegan como una mascota virtual: **lanza la pelota** a Mochi tres veces, **frótala con jabón**, **arrastra la curita** sobre la marquita cuando esté enferma y **acaríciala** recorriendo su cuerpecito.
5. Dormir es intencionalmente un toque: mantiene cómoda la rutina nocturna.
6. **Toca** a la criatura para empezar un mimo y **desliza** sobre el diorama para girarlo cuando no haya una interacción activa.
7. Gana monedas en los minijuegos y compra comida, medicinas y muebles en la tiendita.
8. Vuelve cuando quieras: el juego avanza en tiempo real y te cuenta, con iconos, qué pasó mientras no estabas.

### La criatura pide sola y tiene vida propia

Sobre su cabeza aparecen **globos de icono** que flotan: nunca hay que leer
párrafos. Naranja = le falta algo, rojo = urgente, rosa = está contenta. Y si
no limpias, **se ve la suciedad en el suelo del diorama** (y en la vista 2D),
con burbujas al fregarla. Al dormir se apaga la luz de la habitación, aparece
un «Z z z» y la criatura cierra los ojos. Cuando tiene sueño, **bosteza con un
suspiro tierno** estirando el cuerpecito hacia atrás y abriendo la boquita.
Al evolucionar da un giro feliz de 360°.

### 🪄 Varita mágica: ver el juego completo al instante

Junto a la tienda y el álbum hay un botón con una varita mágica (**«Ver todo»**):
- **Selector de las 17 especies en 3D**: pulsa cualquiera para transformarla en
  directo en el diorama (Mimi, Nube, Chispita, Gardenia, Sol, Sabio de luna con
  sus gafitas, etc.).
- **Ternura y animaciones**: botones para ver el bostezo, el salto de alegría,
  la comida y la fanfarria de evolución cuando quieras.
- **Paseo en el tiempo**: botones para avanzar +2 horas, +6 horas (aparece caca
  para limpiar) y alternar entre Día y Noche.
- **Habitación completa**: botón para llenar la despensa y colocar todos los
  muebles (planta, lámpara, cojín, pelota, gorro).

### Ciclo de vida

`huevo → bebé → niño → adolescente → adulto → anciano`

Cada etapa tiene una duración configurable y **la evolución se ramifica según
tus cuidados**: vínculo, ánimo, higiene, salud, calidad media y descuidos.
Hay 17 especies en el árbol y el final de la vida es una despedida cariñosa:
«se va de viaje», homenaje en el álbum y un bonus de monedas para la cría.

---

## 🎮 Controles

La entrada es **semántica**: el juego escucha acciones (`confirmar`,
`cancelar`, `arriba/abajo/izquierda/derecha`, `menu`, `accionRapida1..4`,
`pausa`), nunca teclas concretas.

| Acción | Teclado | Táctil | Mando |
| --- | --- | --- | --- |
| Mover el foco | ↑ ↓ ← → / W A S D | toque directo | cruceta o stick izquierdo |
| Confirmar | Enter / clic | toque | **A** |
| Cancelar / cerrar | Esc | botón ✕ | **B** |
| Comer (menú despensa) | `1` | botón Comer | **X** |
| Jugar | `2` | botón Jugar | **Y** |
| Limpiar | `3` | botón Limpiar | **LT** |
| Mimar | `4` | toque en la criatura | **RT** |
| Pausa | `P` | botón pausa | **Start** |
| Menú / álbum | `M` | botón Álbum | **Select** |
| Girar cámara | — | arrastrar horizontal | — |
| Cambiar pestaña de tienda | `Q` / `E` | pestañas | **LB** / **RB** |

Al conectar un mando aparece un aviso, los atajos del HUD se convierten en
botones de mando y hay **zona muerta** en los sticks, **anti-repetición** en el
D-pad y **vibración** opcional en eventos importantes. Todo elemento
interactivo es alcanzable por foco con un **anillo visible**. Al abrir un menú,
el foco queda dentro; `Tab` recorre solo ese diálogo y al cerrarlo vuelve al
control desde el que llegaste. Durante los minijuegos, las flechas juegan y
no mueven el foco por detrás.

---

## ✨ Características

- **Diorama 3D de juguete**: criatura 100 % procedural (esferas, cápsulas y
  curvas Catmull-Rom), sombreado *toon*, materiales baratos, una sola luz
  direccional con sombra suave y luz ambiental.
- **Renderizado bajo demanda**: `frameloop="demand"` cuando la escena está
  quieta y `"always"` durante las animaciones; `dpr` limitado y
  `performance={{ min: 0.5 }}`.
- **Detección de capacidades**: con poco hardware se bajan sombras, `dpr` y
  antialias automáticamente.
- **Fallback 2D obligatorio**: si no hay WebGL (o se pierde el contexto), el
  juego sigue siendo jugable con una ilustración SVG. Sin WebGL ni siquiera se
  descarga el módulo 3D; nunca hay una pantalla negra.
- **Tiempo real + progreso offline** con resumen amable y **límite de 12 h** de
  decaimiento.
- **Protección contra el reloj trucado**: si el reloj retrocede se ignora; si
  salta hacia delante de forma absurda se recorta. Siempre se guarda la última
  marca validada.
- **Ciclo día/noche real** que cambia las luces del diorama y la música.
- **Audio 100 % sintetizado** con WebAudio: voz de la criatura por etapa y
  ánimo, mordisquitos, burbujas de baño, fanfarria pentatónica de evolución,
  tintineo de monedas… y **música generativa en bucle** por capas. Efectos y
  música se silencian por separado y de forma persistente.
- **3 minijuegos** con arquitectura de plugin: *Sigue la flecha*, *Eco de
  patitas* y *Atrapa estrellas*. El de memoria enseña la secuencia paso a paso
  y la oculta antes de pedirte que la repitas; en el de estrellas eliges carril
  antes de que caiga el objeto visible.
- **Pausa sin trampas**: detener un minijuego conserva su secuencia y su
  marcador, y el reloj usa tiempo monotónico. Se pausa solo al ocultar la
  pestaña y el premio se cobra una única vez.
- **9 logros** con aviso y campanita al conseguirlos.
- **Suciedad visible**: la caca aparece en el suelo con el tiempo y enferma a la
  criatura si no la limpias; se dibuja con instanciado (una sola draw call).
- **Globos de aviso** flotando sobre la cabeza, idénticos en 3D y en el
  fallback 2D: una sola fuente de verdad (`globosNecesidad`).
- **Álbum / enciclopedia** con las 17 especies y logros.
- **Guardado versionado** en `localStorage` con migración y respaldo en memoria
  para modo incógnito.
- **Diseño responsive real**: `h-dvh`, sin scroll en la pantalla principal,
  objetivos táctiles de 44 px mínimo y modo denso automático en horizontal o
  en pantallas verticales de 360 px de alto. Un mismo módulo de geometría
  mide el área jugable y la comprueba en las verificaciones.

## 🧱 Stack y compatibilidad de versiones (¡importante!)

React 19 + TypeScript estricto (`noUnusedLocals`, `noUnusedParameters`) +
Vite 7 + Tailwind CSS 4 + **@react-three/fiber 9** + **@react-three/drei 10** +
three + Framer Motion + Lucide.

> ⚠️ **No mezcles versiones o perderás horas.**
> `@react-three/fiber@8` empareja con `react@18`; **`@react-three/fiber@9`
> empareja con `react@19`**. Algunas versiones de fiber 9 declaran un tope
> `>=19 <19.3`, así que **fija React en 19.2.x**:
>
> ```bash
> npm i react@19.2 react-dom@19.2
> npm i @react-three/fiber@^9.8 @react-three/drei@^10.7 three@^0.186
> ```
>
> Si npm protesta por *peer dependencies*, es exactamente este problema:
> no lo tapes con `--force`, ajusta las versiones.

---

## 📁 Estructura de carpetas

```
src/
├── game/            # Lógica pura, sin React
│   ├── types.ts         # Tipos: criatura, necesidades, etapa, objeto, guardado
│   ├── especies.ts      # Catálogo de criaturas y árbol de evolución (datos)
│   ├── comidas.ts       # Alimentos, efectos y precios
│   ├── objetos.ts       # Muebles, juguetes, decoración y ropa
│   ├── minijuegos.tsx   # Registro de minijuegos (plugin) + interfaz MiniJuego
│   ├── logros.ts        # Misiones y logros
│   ├── economia.ts      # Monedas, precios y recompensas
│   ├── balance.ts       # Ritmos de decaimiento, umbrales y duración de etapas
│   ├── simulacion.ts    # Motor de necesidades, tiempo real y recuperación offline
│   ├── evolucion.ts     # Reglas de crecimiento y ramificación
│   ├── sound.ts         # Motor WebAudio: efectos, voz y música generativa
│   ├── entrada.ts       # Mapeos semánticos de teclado y botones de mando
│   ├── relojMinijuego.ts # Cuenta atrás monotónica con pausa real
│   ├── migracion.js     # Normalización de guardados antiguos (v0 → v1)
│   ├── geometria.js     # Módulo único de medidas del diorama (UI y tests)
│   └── storage.ts       # Guardado versionado + anti-incógnito
├── hooks/
│   ├── useViewport.ts      # ancho, alto, retrato, altura escasa, reduced-motion
│   ├── useEntrada.ts       # capa semántica: teclado + foco + mando
│   ├── useGamepad.ts       # sondeo en rAF, zona muerta, anti-repetición, vibración
│   ├── useGestoSeguro.ts   # un solo flujo de puntero: tap / arrastre / scroll
│   └── useTiempoReal.ts    # reloj del juego y vuelta de la pestaña
├── tres/            # Todo lo que vive dentro del Canvas
│   ├── Escena.tsx       # Canvas, luces, calidad adaptativa, límite de errores
│   ├── capacidades.ts   # Detección ligera antes de descargar el módulo 3D
│   ├── Criatura.tsx     # Modelo procedural + animaciones de ánimo
│   ├── Habitacion.tsx   # Diorama, muebles e instanciado
│   ├── Particulas.tsx   # Polvo de luz
│   └── Fallback2D.tsx   # Vista SVG si no hay WebGL
├── components/      # HUD, BarraAcciones, MedidorNecesidad, Tienda,
│                    # Enciclopedia, MinijuegosMenu, SelectorComida,
│                    # AvisoMando, ResumenAusencia, Fondo
└── screens/         # StartScreen, GameScreen, MiniJuegoScreen,
                     # EvolucionScreen, GeneracionScreen
scripts/             # Verificaciones automáticas con node
deploy.bat           # Despliegue autocontenido para Windows
```

### Regla de oro de escalabilidad

**Añadir contenido = añadir una entrada a un catálogo.** Para meter una comida
nueva solo editas `src/game/comidas.ts`; para una especie, `especies.ts`; para
un minijuego, escribes un componente y lo registras en `minijuegos.tsx`.
No hay que tocar la UI, la simulación ni el 3D.

```ts
// src/game/comidas.ts — una nueva merienda en una sola entrada
{
  id: "pan-melon",
  nombre: "Pan melón",
  descripcion: "Doradito y dulce.",
  icono: "🍞",
  modelo: "pastel",
  precio: 11,
  efecto: { hambre: 22, animo: 12 }
}
```

---

## 💻 Desarrollo local

```bash
npm install               # instala dependencias
npm run dev               # servidor de desarrollo
npm run build             # build de producción en dist/ (index.html único con todo inline)
npm run preview           # sirve el build
npm run verify            # verificaciones: catálogos, balance, migración, jugabilidad, interacción y responsive
npm run prueba:navegador  # abre el build en Chromium real (playwright): confirma que la splash se reemplaza y el diorama dibuja
```

> **Nota**: la salida de `npm run build` es **un único `dist/index.html` autocontenido** (JS y CSS inline, ~1,4 MB): funciona abierto como archivo local, servido por HTTP o desplegado en cualquier subcarpeta de GitHub Pages.

---

## 🚀 Despliegue en GitHub Pages

En Windows, haz doble clic en **`deploy.bat`**. El script es autocontenido y
ejecuta 10 pasos con mensajes claros y manejo de errores:

1. Comprueba Node.js y npm.
2. Comprueba Git, inicializa el repo, fija `main` y el remoto `origin`.
3. Crea `.gitignore` si falta.
4. Añade `predeploy` / `deploy` a `package.json` con `node -e`.
5. Verifica o inserta `base: '/Raton-Tama/'` en `vite.config.ts`.
6. `npm install` + instala `gh-pages@6.1.1` fijado (versión auditada).
7. `npm run build` y comprueba que existe `dist/index.html`.
8. `git add -A` + commit automático **solo si hay cambios**.
9. `git push origin main`.
10. `npm run deploy` (publica `dist/` en la rama `gh-pages`).

Al terminar, activa en GitHub **Settings → Pages → rama `gh-pages` / (root)**.

Manual, en cualquier sistema:

```bash
npm run build
npx gh-pages -d dist
```

---

## 🩺 Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| Página en blanco en Pages | Pages apunta a `main` en vez de `gh-pages` | Settings → Pages → rama **gh-pages** / (root), luego **Ctrl+F5** |
| Página en blanco tras desplegar | Caché del navegador con rutas viejas | Recarga con **Ctrl+F5** o borra la caché |
| Se congela en «Despertando a tu mascota…» | El módulo JS no se ejecutó (assets 404 por abrir el HTML sin servidor, o un error de importación) | El build empaqueta **todo en un único `index.html`** (`vite-plugin-singlefile`): sin assets externos no puede fallar la carga. Además la splash muestra el error capturado en lugar de congelarse sin aviso. Si persiste, F12 → consola |
| Error de JavaScript en tiempo de ejecución | Cualquier excepción no controlada | La splash escribe el mensaje del error (`boot-error`); la app además tiene límites de error que activan el fallback 2D |
| No aparece nada, ni siquiera el splash | Caché o rama mal configurada | Revisa que Pages use `gh-pages` y fuerza recarga |
| Aviso de «Vista 2D activa» | No hay WebGL, está bloqueado o falló el contexto | Es **normal y jugable**: el fallback SVG mantiene todo el juego |
| WebGL lento en el móvil | Dispositivo de gama baja | El juego baja sombras, `dpr` y antialias solo; activa menos pestañas |
| `.bat` se detiene tras `npm install` | `npm`/`npx`/`node` sin `call` en un `.bat` | Son scripts `.cmd`: siempre `call npm ...` (ya está hecho en `deploy.bat`) |
| `No se esperaba ... en este momento` | Paréntesis dentro de un bloque `if (...)` | Quita los paréntesis de los mensajes `echo` (ya está hecho) |
| `El sistema no encuentra la etiqueta por lotes` | `goto` desde dentro de un bloque con paréntesis, o fichero con finales LF | El script evita `goto` en bloques y se guarda con **CRLF** |
| Las etiquetas del `.bat` fallan | Fichero guardado con LF | Convierte a CRLF: `unix2dos deploy.bat` |
| Los `!` desaparecen en los mensajes | `EnableDelayedExpansion` activo | El script usa `DisableDelayedExpansion` |
| No hay sonido | El navegador exige un gesto del usuario | Pulsa cualquier botón: el audio despierta con el primer toque |
| Se pierde la partida en incógnito | `localStorage` bloqueado | Hay respaldo en memoria; se conserva durante la pestaña |
| No detecta el mando | Navegador sin Gamepad API o mando sin pulsar | Pulsa un botón del mando para que el sistema lo despierte |
| La mascota parece muy hambrienta al volver | Estuviste fuera muchas horas | Es el decaimiento real, **limitado a 12 h**; el resumen te lo cuenta |

---

## ✅ Verificaciones automáticas

`npm run verify` ejecuta `scripts/verificar.mjs`, que lanza:

| Script | Qué comprueba |
| --- | --- |
| `verificar-catalogos.mjs` | IDs únicos, referencias válidas, precios positivos, árbol de evolución alcanzable y sin ciclos, plugins de minijuegos completos |
| `verificar-balance.mjs` | Ninguna necesidad baja a un ritmo imposible de atender, límite offline, recuperación al dormir |
| `verificar-migracion.mjs` | Migrar una partida v0 → v1 no pierde datos |
| `verificar-jugabilidad.mjs` | Pruebas dinámicas del motor real: reloj de minijuego, pausa, teclado/mando, WebGL sin contexto, simulación offline, comida y premio |
| `verificar-interaccion.mjs` | Objetivos táctiles de 44 px (o zona ampliada), un solo flujo de puntero, `touch-action` correcto, duraciones y recompensas de los minijuegos |
| `verificar-responsive.mjs` | El marco real del diorama cabe de 320×360 a 2560×1080, con modo denso vertical y horizontal |

Estas pruebas ejecutan lógica real de la simulación y comprueban los presupuestos
de layout, pero no sustituyen una revisión visual en navegador ni una prueba
con mando físico y `deploy.bat` en Windows.

---

## 📄 Licencia

Proyecto de fan con fines educativos. Hecho con cariño.
