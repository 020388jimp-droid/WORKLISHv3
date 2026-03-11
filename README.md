# WORKLISH - English Learning for Professionals

Aplicacion de aprendizaje de ingles profesional potenciada por IA, construida con Firebase y Google Cloud.

## Arquitectura

- **Frontend:** React 19 + Tailwind CSS + Shadcn/UI
- **Backend:** Firebase Cloud Functions (Node.js 20)
- **Base de datos:** Firestore
- **Autenticacion:** Firebase Authentication (Email/Password + Google)
- **IA:** Google Gemini 1.5 Flash (texto, voz, conversacion)
- **Hosting:** Firebase Hosting

## Estructura del Proyecto

```
worklish/
├── firebase.json          # Configuracion Firebase
├── .firebaserc            # Alias del proyecto
├── firestore.rules        # Reglas de seguridad Firestore
├── firestore.indexes.json # Indices de Firestore
├── functions/             # Cloud Functions (backend)
│   ├── index.js           # Logica de las funciones
│   ├── package.json       # Dependencias
│   └── .env               # Variables de entorno (Gemini API key)
└── frontend/              # Aplicacion React
    ├── src/
    │   ├── components/    # Componentes reutilizables
    │   ├── contexts/      # React Contexts (Auth, Language)
    │   ├── lib/           # Firebase config, utilidades
    │   └── pages/         # Paginas de la app
    ├── package.json
    └── public/
```

## Notas de Desarrollo y Despliegue

### Arreglo del Layout del Dashboard (11/Mar/2026)

Se identificó y solucionó un problema de layout en el dashboard que afectaba la visibilidad y el comportamiento de la barra lateral.

**Problema:**
- La barra lateral no era fija y, en pantallas con altura reducida (zoom o laptops), no era posible acceder a los últimos elementos del menú, como "Cerrar Sesión", porque la barra lateral no tenía scroll.

**Solución Implementada:**
1.  **Se restauraron los archivos a su estado original** para eliminar modificaciones fallidas (`git checkout -- <file>`).
2.  **Se hizo la barra lateral desplazable:** En `frontend/src/components/Sidebar.jsx`, se añadió la clase `overflow-y-auto` de Tailwind CSS al elemento `<aside>` principal. Esto asegura que aparezca un scroll vertical si el contenido excede la altura de la pantalla.

### Puesta en Marcha y Solución de Problemas (11/Mar/2026)

Para lograr el despliegue completo y la correcta comunicación entre el frontend y el backend, se realizaron los siguientes ajustes críticos:

1.  **Conexión Frontend-Backend:**
    *   Se creó y configuró el archivo `frontend/.env` con las variables de entorno de la configuración de Firebase (`firebaseConfig`). Este paso es **fundamental** para que la aplicación React sepa a qué proyecto de Firebase conectarse.

2.  **Resolución de Conflictos de Dependencias (Frontend):**
    *   Al ejecutar `npm install` en la carpeta `frontend`, la instalación falló debido a conflictos de versiones con dependencias pares (peer dependencies), principalmente relacionadas con `eslint`.
    *   **Solución:** Se forzó la instalación utilizando la bandera `--legacy-peer-deps`, que ignora estos conflictos y permite completar la instalación. El comando ejecutado fue:
        ```bash
        npm install --prefix frontend --legacy-peer-deps
        ```

3.  **Configuración de `.gitignore`:**
    *   Se detectó que el archivo `.gitignore` principal estaba vacío, lo que causaba que Git intentara subir archivos sensibles como `.env`.
    *   **Solución:** Se creó un archivo `.gitignore` robusto en la raíz del proyecto para excluir carpetas como `node_modules`, archivos de compilación como `build`, y, muy importante, todos los archivos `.env`.

4.  **Despliegue Final:**
    *   Se compiló el frontend (`npm run build --prefix frontend`) y se desplegó en Firebase Hosting.
    *   Se instalaron las dependencias del backend (`npm install --prefix functions`) y se desplegaron las Cloud Functions en Firebase.

5.  **Commit y Documentación:**
    *   Finalmente, se documentaron estos pasos en el `README.md` y se preparó el repositorio para un commit que refleja el estado 100% funcional del proyecto.

## Desarrollo Local (Original)

### Con Firebase Emulators

```bash
firebase emulators:start
cd frontend && yarn start
```