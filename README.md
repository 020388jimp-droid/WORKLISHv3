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

## Despliegue en Firebase Studio

### 1. Importar desde GitHub

1. Ve a [Firebase Studio](https://studio.firebase.google.com)
2. Crea un nuevo proyecto o selecciona "worklish-c9caf"
3. Conecta tu repositorio de GitHub

### 2. Configurar Variables de Entorno

Asegurate de que el archivo `functions/.env` contenga tu Gemini API key:
```
GEMINI_API_KEY=tu_clave_gemini_aqui
```

### 3. Instalar Dependencias

```bash
# Frontend
cd frontend
yarn install

# Cloud Functions
cd ../functions
npm install
```

### 4. Build del Frontend

```bash
cd frontend
yarn build
```

### 5. Desplegar

```bash
# Desplegar todo (hosting + functions + firestore rules)
firebase deploy

# O desplegar individualmente:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Desarrollo Local

### Con Firebase Emulators

```bash
# Iniciar emuladores de Firebase
firebase emulators:start

# En otra terminal, iniciar el frontend
cd frontend
yarn start
```

Para usar emuladores locales, configura `REACT_APP_FUNCTIONS_URL` en `frontend/.env`:
```
REACT_APP_FUNCTIONS_URL=http://localhost:5001/worklish-c9caf/us-central1
```

## Funcionalidades

### Practica de Escritura
Escribe textos en ingles y recibe correcciones gramaticales, sugerencias de vocabulario y tips profesionales.

### Entrenamiento de Voz
Graba tu voz y recibe retroalimentacion sobre tu pronunciacion con transcripcion automatica.

### Video Llamada con IA
Practica conversaciones profesionales en escenarios reales (entrevistas, reuniones, presentaciones).

### Niveles de Dificultad
- **Principiante:** App en espanol, feedback en espanol
- **Intermedio:** App en ingles, feedback en espanol
- **Avanzado:** Todo en ingles (inmersion total)

## APIs Utilizadas

- **Google Gemini 1.5 Flash:** Correccion de texto, feedback de voz, conversacion IA
- **Firebase Auth:** Autenticacion de usuarios
- **Firestore:** Almacenamiento de perfiles y practicas
- **Web Speech API:** Text-to-Speech para respuestas del AI tutor

## Configuracion de Firebase

El proyecto usa el proyecto Firebase `worklish-c9caf`. Para usar tu propio proyecto:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita Authentication (Email/Password + Google)
3. Habilita Firestore
4. Actualiza `frontend/src/lib/firebase.js` con tus credenciales
5. Actualiza `.firebaserc` con tu project ID
6. Obtiene una [Gemini API key](https://aistudio.google.com/apikey) y ponla en `functions/.env`
