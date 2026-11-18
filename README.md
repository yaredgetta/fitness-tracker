# 🏋️ Fitness Tracker

[![CI](https://github.com/TU_USUARIO/TU_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/TU_USUARIO/TU_REPO/actions/workflows/ci.yml)
![Expo](https://img.shields.io/badge/Expo-React%20Native-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)

Aplicación móvil para registrar entrenamientos de gimnasio, compararlos con tus sesiones anteriores y ver cómo evolucionan tu fuerza y tu volumen. Todo se guarda **en el teléfono**: sin cuentas, sin servidor y sin conexión a internet.

Está pensada para registrar una serie en pocos segundos mientras entrenas, con una experiencia inspirada en Strong y Hevy.

<!--
CAPTURAS: sube 3 o 4 capturas de pantalla a docs/screenshots/ y descomenta esto.

<p align="center">
  <img src="docs/screenshots/dashboard.png" width="230" />
  <img src="docs/screenshots/session.png" width="230" />
  <img src="docs/screenshots/muscle-map.png" width="230" />
</p>
-->

## ✨ Funciones

**Registro de sesiones**
- Cronómetro, ejercicios con tarjetas expandibles y series editables: peso, repeticiones, RIR y fallo muscular.
- Buscador de más de 1,300 ejercicios en español e inglés, con cinco categorías: Piernas, Brazos, Pecho, Espalda y Abdomen.
- Ejercicios personalizados.
- Autoguardado: si la app se cierra a media sesión, puedes reanudarla.
- Pesos en **kg o lb** (se guardan siempre en kg, así que cambiar de unidad no altera el historial).

**Comparación y progreso**
- Cada serie muestra la serie equivalente de tu última sesión y la diferencia (▲ mejora, = igual, ▼ baja).
- Récords personales (PR): peso máximo, más repeticiones con un peso y mayor volumen.
- Gráfica de progresión con todos tus ejercicios a la vez, cada uno de un color, por peso, repeticiones, volumen o RIR.

**Análisis**
- Mapa muscular con vista frontal y posterior: colorea cada músculo según el volumen registrado en 7 días, 30 días o todo el historial.
- Historial agrupado por día, con el detalle de cada serie.

> El mapa muscular muestra **volumen registrado** (peso × repeticiones), no fatiga ni recuperación. El color es relativo al músculo más trabajado del periodo, y los músculos secundarios cuentan la mitad.

## 🧰 Tecnologías

| | |
|---|---|
| Framework | React Native + [Expo](https://expo.dev) |
| Lenguaje | TypeScript (modo estricto) |
| Navegación | Expo Router |
| Estado | [Zustand](https://github.com/pmndrs/zustand) |
| Persistencia | AsyncStorage (todo local) |
| Gráficas y anatomía | `react-native-svg` |
| Pruebas | [Vitest](https://vitest.dev) |

## 🚀 Empezar

Necesitas [Node.js](https://nodejs.org) 20 o superior y la app **Expo Go** en tu teléfono.

```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
npm install
npm run fetch:exercises   # descarga el catálogo de ejercicios (obligatorio, ver "Datos y créditos")
npx expo start
```

> El catálogo de ejercicios **no está en el repositorio**. Sin ejecutar `npm run fetch:exercises`, la app no compila.

Escanea el código QR con Expo Go (en iPhone, con la cámara). El teléfono y la computadora deben estar en la misma red; si no conecta, prueba `npx expo start --tunnel`.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Inicia el servidor de desarrollo de Expo |
| `npm run fetch:exercises` | Descarga el catálogo de ejercicios a `assets/data/exercises.json` |
| `npm test` | Ejecuta las pruebas |
| `npm run typecheck` | Comprueba los tipos de la lógica |

Si faltan en tu `package.json`, agrégalos dentro de `"scripts"`:

```json
"start": "expo start",
"fetch:exercises": "node scripts/fetch-exercises.mjs",
"test": "vitest run",
"typecheck": "tsc -p tsconfig.check.json"
```

## 📦 Generar un APK para Android

Se compila en la nube con [EAS Build](https://docs.expo.dev/build/introduction/); no hace falta Android Studio.

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

El perfil `preview` de [`eas.json`](eas.json) genera un `.apk` instalable. Antes del primer build, define un identificador único en `app.json`:

```json
"android": { "package": "com.tunombre.fitnesstracker" }
```

Antes de compilar, ejecuta `npm run fetch:exercises`: el catálogo no está en git, pero el archivo [`.easignore`](.easignore) hace que EAS lo suba de tu equipo para incluirlo en el APK. (EAS usa `.easignore` en lugar de `.gitignore` cuando existe; si cambias el `.gitignore`, mantén ambos archivos sincronizados.)

> Los datos guardados en Expo Go **no pasan** a la app instalada: son almacenamientos distintos.

## 🗂️ Estructura

```
├─ src/
│  ├─ app/          Pantallas y rutas (Expo Router)
│  ├─ components/   Componentes: common, dashboard, muscle-map, session
│  ├─ constants/    Tabla de músculos, geometría del cuerpo, categorías
│  ├─ models/       Tipos e interfaces
│  ├─ services/     Lógica de negocio (comparación, PR, volumen, búsqueda…)
│  ├─ storage/      Persistencia local, validación y recuperación de datos
│  ├─ store/        Estado global (Zustand)
│  ├─ theme/        Colores y espaciado
│  └─ utils/        Funciones puras (volumen, RIR, validación, unidades…)
├─ assets/data/     Catálogo de ejercicios (se descarga; no está en el repo)
├─ scripts/         Descarga y preparación del catálogo
├─ __tests__/       Pruebas automáticas
├─ .easignore       Reglas de EAS Build (incluye el catálogo en el APK)
└─ docs/            Documentación y lista de pruebas manuales
```

Las capas dependen en un solo sentido: `pantallas → stores → servicios → storage / utils`. La lógica de `services/` y `utils/` es pura y no depende de React Native, por eso se prueba con facilidad.

## 🧮 Reglas de negocio

- **Volumen** de una serie = peso × repeticiones. Solo cuentan las series **completadas**.
- **RIR y fallo** siempre son consistentes: marcar fallo pone RIR 0, y un RIR mayor que 0 desmarca el fallo.
- **Comparación:** subir el peso no cuenta como mejora si el volumen cae un 15 % o más.
- **PR:** el primer registro de un ejercicio no cuenta, porque no hay nada que superar.
- **Peso corporal:** se permite peso 0. Esos músculos no quedan en gris en el mapa.

## 💾 Cómo se guardan los datos

Todo vive en AsyncStorage, en el teléfono:

| Clave | Contenido |
|---|---|
| `@ft/user` | Nombre del usuario |
| `@ft/session/{id}` | Cada sesión terminada |
| `@ft/sessionIndex` | Índice de sesiones |
| `@ft/activeSession` | Borrador de la sesión en curso (autoguardado) |
| `@ft/settings` | Unidad de peso |
| `@ft/customExercises` | Ejercicios personalizados |

Cada documento incluye una versión de esquema para poder migrarlo. Al leer, los datos se validan: lo dañado se ignora en lugar de romper la app, y si el índice de sesiones se pierde o se desactualiza, se reconstruye a partir de las sesiones guardadas.

## ✅ Pruebas

```bash
npm test
```

Hay unas 160 pruebas automáticas que cubren cálculos, comparaciones, PR, mapa muscular, búsqueda, unidades, persistencia, recuperación de datos dañados y un recorrido completo de varias semanas con cierres de la app.

Si no tienes el catálogo descargado, las pruebas que lo necesitan se **omiten** con un aviso (así funciona también el CI de GitHub). Para correrlas todas, ejecuta antes `npm run fetch:exercises`.

Lo que no se puede automatizar (cerrar la app deslizándola, apagar el teléfono, uso real en el gimnasio) está en [`docs/PRUEBAS_MANUALES.md`](docs/PRUEBAS_MANUALES.md).

## ⚠️ Límites conocidos

- **Sin respaldo:** al ser todo local, desinstalar la app o borrar sus datos elimina el historial.
- **Autoguardado:** escribe medio segundo después de cada cambio. Si la app se cierra de golpe justo después de teclear un valor, ese último cambio puede perderse; lo anterior no.
- **Cuerpo estilizado:** el mapa muscular es un dibujo simplificado, no anatomía realista.
- **Buscador:** entre resultados igual de relevantes salen primero los de nombre más corto.
- **Hombros:** en el buscador se agrupan dentro de la categoría Brazos.

## 🗺️ Ideas a futuro

- Exportar e importar los datos (respaldo manual).
- Temporizador de descanso entre series.
- Dibujo anatómico más detallado.
- Plantillas de rutinas.

## 📚 Datos y créditos

### Catálogo de ejercicios

La app usa un catálogo de 1,323 ejercicios con nombre e instrucciones en español e inglés. **No se incluye en este repositorio**: se obtiene del proyecto original.

- **Origen:** [JahelCuadrado/ExerciseGymGifsDB](https://github.com/JahelCuadrado/ExerciseGymGifsDB), una API estática de archivos JSON servida por GitHub y el CDN de jsDelivr.
- **Cómo obtenerlo:** `npm run fetch:exercises`. El script [`scripts/fetch-exercises.mjs`](scripts/fetch-exercises.mjs) descarga las listas en español e inglés (`api/es/exercises.json` y `api/en/exercises.json`, versión `v1.1.0`), las une y guarda el resultado en `assets/data/exercises.json`. Para otra versión publicada (etiqueta de git): `EXERCISES_VERSION=vX.Y.Z npm run fetch:exercises`. La `v1.1.0` es la última estable; la 1.2.0 sigue en desarrollo.
- **Dónde queda:** `assets/data/exercises.json` (está en el `.gitignore`).

Formato que espera la app, por si prefieres prepararlo tú:

```jsonc
{
  "source": "https://github.com/JahelCuadrado/ExerciseGymGifsDB",
  "count": 1323,
  "exercises": [
    {
      "id": "biceps/barbell-curl",          // único; también se usa como clave en el historial
      "slug": "barbell-curl",
      "muscle": "biceps",                    // músculo principal (19 valores del catálogo)
      "bodyPart": "arms",
      "equipment": "barbell",
      "category": "strength",                // strength y plyometrics se pueden registrar; cardio y stretching se ocultan
      "secondaryMuscles": ["forearms"],
      "name": { "es": "Curl con barra", "en": "Barbell Curl" },
      "instructions": { "es": ["…"], "en": ["…"] }
    }
  ]
}
```

La app traduce los 19 músculos del catálogo a 11 grupos del mapa en [`src/constants/muscleMap.ts`](src/constants/muscleMap.ts). Solo usa el texto (nombres, instrucciones y clasificación): los GIFs, y los campos `file` y `gifUrl`, se descartan.

### Derechos del catálogo

El README del proyecto original aclara que sus imágenes y GIFs se recopilaron de Internet, que su autor no posee los derechos sobre ellos y que **no puede concederlos a terceros**. Añade que los GIFs pertenecen a sus respectivos autores y que el repositorio solo ofrece una capa de organización. No declara una licencia de uso para los datos de texto.

Esta app solo usa texto, no GIFs. Aun así, como no hay una licencia que permita redistribuirlo, este repositorio **no incluye el catálogo** y cada persona lo descarga del origen. Si piensas publicar la app (por ejemplo, en una tienda) o compartir el archivo o un APK ya compilado, contacta antes al autor original. Esto no es asesoría legal.

## 📄 Licencia

El código se distribuye bajo la licencia [MIT](LICENSE). El catálogo de ejercicios es de un tercero y no está cubierto por ella.
