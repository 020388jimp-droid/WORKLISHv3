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

### Proceso de Despliegue Realizado

Estos son los pasos prácticos que se siguieron para poner en línea tanto el frontend como el backend desde el entorno de desarrollo.

**Frontend (Firebase Hosting):**
1.  **Navegar al directorio del frontend:**
    ```bash
    cd frontend
    ```
2.  **Compilar la aplicación de React:** Este comando crea una carpeta `build` con la versión optimizada y lista para producción.
    ```bash
    npm run build
    ```
3.  **Desplegar en Firebase Hosting:** Se utilizó la herramienta de despliegue del IDE, especificando la carpeta `frontend/build` como el directorio a publicar. Esto es equivalente a ejecutar:
    ```bash
    firebase deploy --only hosting
    ```

**Backend (Firebase Functions):**
1.  **Navegar al directorio de las funciones:**
    ```bash
    cd functions
    ```
2.  **Instalar dependencias:** Es crucial ejecutar este comando para instalar los paquetes de Node.js necesarios para que el backend funcione.
    ```bash
    npm install
    ```
3.  **Configurar Variables de Entorno:** Asegurarse de que el archivo `functions/.env` exista y contenga la clave de API necesaria.
    ```
    GEMINI_API_KEY=tu_clave_secreta_aqui
    ```
4.  **Desplegar las Cloud Functions:** Este comando sube y activa el código del backend en Firebase.
    ```bash
    firebase deploy --only functions
    ```

## Desarrollo Local (Original)

### Con Firebase Emulators

```bash
firebase emulators:start
cd frontend && yarn start
```

