# Codigo de la app de escritorio que ira en la caja del restaurante

Proyecto electron hecho con React y typescript para la computadora del restaurante o caja, servira como servidor local y se pueden
hacer pedidos, revisar los pedidos hechos, pagarlos y separar por cuentas

## Tecnologías

- Electron
- Typescript
- Zustand
- React

## Instalación

```bash
cd Desktop-APP
npm install
npm run dev
```

Deberias poder ver el proyecto inmediatamente

### Builds Para generar los paquetes que se instalan en la computadora

```bash
# Para windows
$ npm run build:win

# Para macOS
$ npm run build:mac

# Para Linux
$ npm run build:linux
```

## Estructura de Carpetas del Proyecto

```
Desktop-APP/
│
├── .editorconfig
├── .env
├── .gitignore
├── .prettierignore
├── .prettierrc.yaml
├── dev-app-update.yml
├── electron-builder.yml
├── electron.vite.config.ts
├── eslint.config.mjs
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
│
├── build/                # Archivos de compilación e iconos para la app
│   ├── entitlements.mac.plist
│   ├── icon.icns
│   ├── icon.ico
│   └── icon.png
│
├── resources/            # Recursos estáticos (iconos, imágenes)
│   └── icon.png
│
├── src/                  # Código fuente principal
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── main/             # Código principal de Electron (backend)
│   │   ├── index.ts
│   │   └── Store.ts
│   ├── preload/          # Preload scripts para comunicación segura
│   │   ├── index.d.ts
│   │   └── index.ts
│   └── renderer/         # Frontend React (vistas y componentes)
│       ├── types/
│       ├── src/
│       │   ├── views/    # Vistas principales de la app (pantallas)
│       │   ├── components/ # Componentes reutilizables
│       │   ├── store/    # Zustand stores (estado global)
│       │   └── features/ # Funcionalidades específicas
│
├── .vscode/              # Configuración de VS Code
│   ├── extensions.json
│   ├── launch.json
│   └── settings.json
```

**Notas:**

- El código backend de Electron está en `src/main/`.
- El frontend React está en `src/renderer/src/`.
- Los componentes reutilizables y las vistas se encuentran en `src/renderer/src/components/` y `src/renderer/src/views/`.
- Los stores de Zustand para el manejo de estado están en `src/renderer/src/store/`.
- Los recursos estáticos (iconos) están en `resources/` y `build/`.
- La configuración y scripts de desarrollo están en la raíz y en `.vscode/`.

Esta estructura te ayuda a mantener el proyecto organizado

# Buenas Prácticas de Código

Usa camelCase para nombres de variables y funciones.

Formatea el código con Prettier antes de guardar.

Comenta partes importantes del código.

Usa nombres de variables claros y descriptivos.

En formularios, usa los mismos nombres que los campos que ve el usuario.

## -----------------------------FLUJO DE TRABAJO QUE SE UTILIZA EN QUALITY ------------------------------------------

## COMMITS

Formato:
<tipo de commit>: <descripción clara de lo que hiciste>

Tipos:

feature: nueva funcionalidad

bugfix: arreglo de error

refactor: mejora o reestructura sin cambiar la lógica

style: cambios visuales o de estilo (sin lógica nueva)

docs: documentación (README o comentarios)

Ejemplo:
feature: nuevo formulario de registro de usuario funcionando

# RAMAS:

main: rama de producción.

develop: rama de desarrollo.

feature/<nombre>: rama para cada nueva funcionalidad.

Flujo de trabajo:

Crea una nueva rama desde develop.

Al terminar tu feature, haz un pull request a develop.

Asegúrate de no romper código de tus compañeros.

Elimina la rama después del merge.
