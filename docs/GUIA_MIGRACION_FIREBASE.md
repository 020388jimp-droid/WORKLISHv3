# 🚀 WORKLISH - Guía Completa de Migración a Google/Firebase

## Versión 1.0 | Marzo 2026

---

# 📋 ÍNDICE

1. [Resumen de la Migración](#1-resumen-de-la-migración)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Paso 1: Configurar Firebase](#3-paso-1-configurar-firebase)
4. [Paso 2: Habilitar APIs de Google Cloud](#4-paso-2-habilitar-apis-de-google-cloud)
5. [Paso 3: Descargar el Proyecto](#5-paso-3-descargar-el-proyecto)
6. [Paso 4: Configurar Firebase en el Proyecto](#6-paso-4-configurar-firebase-en-el-proyecto)
7. [Paso 5: Migrar el Backend](#7-paso-5-migrar-el-backend)
8. [Paso 6: Migrar el Frontend](#8-paso-6-migrar-el-frontend)
9. [Paso 7: Configurar Firebase Studio](#9-paso-7-configurar-firebase-studio)
10. [Paso 8: Deploy a Firebase Hosting](#10-paso-8-deploy-a-firebase-hosting)
11. [Solución de Problemas](#11-solución-de-problemas)
12. [Comandos Rápidos de Referencia](#12-comandos-rápidos-de-referencia)

---

# 1. RESUMEN DE LA MIGRACIÓN

## ¿Qué cambiamos?

| Componente | Antes | Después (Google) |
|------------|-------|------------------|
| Base de datos | MongoDB | Firebase Firestore |
| Autenticación | JWT propio | Firebase Authentication |
| LLM (texto) | Gemini via Emergent | Gemini API directo |
| Speech-to-Text | OpenAI Whisper | Google Cloud Speech-to-Text |
| Text-to-Speech | Web Speech API | Google Cloud Text-to-Speech |
| Backend | FastAPI (Python) | Firebase Cloud Functions |
| Hosting | Servidor propio | Firebase Hosting |

## Arquitectura Final

```
┌─────────────────────────────────────────────────────────┐
│                    WORKLISH                              │
├─────────────────────────────────────────────────────────┤
│  Frontend (React)          │  Firebase Hosting           │
├─────────────────────────────────────────────────────────┤
│  Autenticación             │  Firebase Auth              │
├─────────────────────────────────────────────────────────┤
│  Base de Datos             │  Cloud Firestore            │
├─────────────────────────────────────────────────────────┤
│  Backend/APIs              │  Cloud Functions            │
├─────────────────────────────────────────────────────────┤
│  IA Texto                  │  Gemini API                 │
├─────────────────────────────────────────────────────────┤
│  IA Voz (STT/TTS)          │  Google Cloud Speech APIs   │
└─────────────────────────────────────────────────────────┘
```

---

# 2. REQUISITOS PREVIOS

## 2.1 Cuentas necesarias
- ✅ Cuenta de Google Cloud (ya la tienes con proyecto WORKLISH)
- ✅ Firebase habilitado en el proyecto
- ✅ Gemini API Key (ya la tienes)

## 2.2 Software a instalar en tu computadora

### Windows
```powershell
# 1. Instalar Node.js (si no lo tienes)
# Descargar de: https://nodejs.org/en/download/
# Versión recomendada: 18 LTS o superior

# 2. Verificar instalación
node --version
npm --version

# 3. Instalar Firebase CLI globalmente
npm install -g firebase-tools

# 4. Verificar Firebase CLI
firebase --version

# 5. Instalar Git (si no lo tienes)
# Descargar de: https://git-scm.com/download/win
```

### Mac
```bash
# 1. Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Instalar Node.js
brew install node

# 3. Instalar Firebase CLI
npm install -g firebase-tools

# 4. Verificar
node --version
firebase --version
```

### Linux (Ubuntu/Debian)
```bash
# 1. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar Firebase CLI
npm install -g firebase-tools

# 3. Verificar
node --version
firebase --version
```

---

# 3. PASO 1: CONFIGURAR FIREBASE

## 3.1 Acceder a Firebase Console

1. Abre tu navegador y ve a: **https://console.firebase.google.com/**
2. Inicia sesión con tu cuenta de Google
3. Verás tu proyecto "WORKLISH" (si no, créalo vinculándolo a tu proyecto de Google Cloud)

## 3.2 Habilitar Firebase Authentication

1. En el menú izquierdo, haz clic en **"Authentication"**
2. Clic en **"Comenzar"** o **"Get started"**
3. En la pestaña **"Sign-in method"**, habilita:
   - ✅ **Correo electrónico/contraseña** (Email/Password)
   - ✅ **Google** (opcional, para login con Google)

### Configuración de Email/Password:
```
1. Clic en "Correo electrónico/contraseña"
2. Activa el primer switch "Habilitar"
3. Clic en "Guardar"
```

### Configuración de Google Sign-in (opcional):
```
1. Clic en "Google"
2. Activa "Habilitar"
3. Selecciona tu correo de soporte
4. Clic en "Guardar"
```

## 3.3 Crear Cloud Firestore

1. En el menú izquierdo, haz clic en **"Firestore Database"**
2. Clic en **"Crear base de datos"**
3. Selecciona modo:
   - **"Modo de producción"** (recomendado)
4. Selecciona ubicación:
   - **"us-central1"** (o la más cercana a tus usuarios)
5. Clic en **"Habilitar"**

## 3.4 Configurar Reglas de Seguridad de Firestore

1. En Firestore, ve a la pestaña **"Reglas"**
2. Reemplaza el contenido con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Progreso del usuario
    match /progress/{odcId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Historial de prácticas
    match /practices/{odcId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Clic en **"Publicar"**

## 3.5 Obtener Configuración de Firebase

1. En Firebase Console, haz clic en el ícono de engranaje ⚙️ (arriba a la izquierda)
2. Selecciona **"Configuración del proyecto"**
3. Desplázate hacia abajo hasta **"Tus apps"**
4. Si no hay una app web, clic en el ícono **"</>"** (Web)
5. Nombre de la app: **"worklish-web"**
6. ✅ Marca "Configurar Firebase Hosting"
7. Clic en **"Registrar app"**

### IMPORTANTE: Copia esta configuración (la necesitarás después)

```javascript
// Tu configuración se verá algo así:
const firebaseConfig = {
  apiKey: "AIzaSy.....................",
  authDomain: "worklish-XXXXX.firebaseapp.com",
  projectId: "worklish-XXXXX",
  storageBucket: "worklish-XXXXX.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**¡GUARDA ESTA CONFIGURACIÓN!** La usaremos en el Paso 6.

---

# 4. PASO 2: HABILITAR APIS DE GOOGLE CLOUD

## 4.1 Acceder a Google Cloud Console

1. Ve a: **https://console.cloud.google.com/**
2. Asegúrate de que el proyecto **"WORKLISH"** esté seleccionado (arriba)

## 4.2 Habilitar APIs necesarias

### Método 1: Desde la Biblioteca de APIs

1. En el menú izquierdo: **APIs y servicios** → **Biblioteca**
2. Busca y habilita cada una:

#### Cloud Speech-to-Text API
```
1. Buscar: "Cloud Speech-to-Text API"
2. Clic en el resultado
3. Clic en "HABILITAR"
```

#### Cloud Text-to-Speech API
```
1. Buscar: "Cloud Text-to-Speech API"
2. Clic en el resultado
3. Clic en "HABILITAR"
```

#### Generative Language API (Gemini) - Ya debería estar habilitada
```
1. Buscar: "Generative Language API"
2. Verificar que diga "API HABILITADA"
3. Si no, hacer clic en "HABILITAR"
```

### Método 2: Usando gcloud CLI (más rápido)

```bash
# Autenticarte
gcloud auth login

# Seleccionar proyecto
gcloud config set project TU_PROJECT_ID

# Habilitar APIs
gcloud services enable speech.googleapis.com
gcloud services enable texttospeech.googleapis.com
gcloud services enable generativelanguage.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## 4.3 Crear/Verificar API Key para Gemini

1. Ve a: **APIs y servicios** → **Credenciales**
2. Ya tienes "Gemini API Key" - haz clic en **"Mostrar clave"**
3. **COPIA Y GUARDA** esta clave de forma segura

```
Tu Gemini API Key: AIzaSy.....................................
```

## 4.4 Crear Cuenta de Servicio (para Speech APIs)

1. En **Credenciales**, clic en **"+ CREAR CREDENCIALES"**
2. Selecciona **"Cuenta de servicio"**
3. Nombre: **"worklish-speech-service"**
4. Clic en **"CREAR Y CONTINUAR"**
5. Rol: **"Propietario"** (o específico: Cloud Speech Admin + Cloud Text-to-Speech User)
6. Clic en **"CONTINUAR"** → **"LISTO"**

### Descargar la clave JSON:
1. En la lista de cuentas de servicio, clic en la que creaste
2. Ve a la pestaña **"CLAVES"**
3. Clic en **"AGREGAR CLAVE"** → **"Crear clave nueva"**
4. Formato: **JSON**
5. Clic en **"CREAR"**
6. Se descargará un archivo .json - **¡GUÁRDALO DE FORMA SEGURA!**

```
Ejemplo del archivo descargado: worklish-xxxxx-firebase-adminsdk-xxxxx.json
```

---

# 5. PASO 3: DESCARGAR EL PROYECTO

## 5.1 Opción A: Descargar desde GitHub (Recomendado)

Una vez que suba el proyecto a GitHub, podrás descargarlo así:

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/worklish.git

# Entrar al directorio
cd worklish
```

## 5.2 Opción B: Descargar como ZIP desde Emergent

1. En la plataforma Emergent, usa la opción de **"Descargar código"**
2. Extrae el ZIP en tu computadora
3. Abre una terminal en esa carpeta

## 5.3 Estructura del Proyecto Descargado

```
worklish/
├── backend/                 # Backend FastAPI (lo migraremos a Cloud Functions)
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/                # Frontend React
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
├── functions/               # NUEVO: Cloud Functions (crearemos)
├── firebase.json            # NUEVO: Configuración Firebase (crearemos)
└── .firebaserc              # NUEVO: Proyecto Firebase (crearemos)
```

---

# 6. PASO 4: CONFIGURAR FIREBASE EN EL PROYECTO

## 6.1 Inicializar Firebase en el proyecto

Abre una terminal en la carpeta raíz del proyecto:

```bash
# 1. Navegar a la carpeta del proyecto
cd /ruta/a/worklish

# 2. Autenticarte en Firebase
firebase login

# Se abrirá el navegador - inicia sesión con tu cuenta de Google
# Verás: "✔ Success! Logged in as tu@email.com"

# 3. Inicializar Firebase
firebase init
```

## 6.2 Configuración interactiva de Firebase Init

Cuando ejecutes `firebase init`, sigue estos pasos EXACTAMENTE:

```
? Which Firebase features do you want to set up for this directory?
❯ ◉ Firestore: Configure security rules and indexes files
  ◉ Functions: Configure a Cloud Functions directory
  ◉ Hosting: Configure files for Firebase Hosting
  ◯ Hosting: Set up GitHub Action deploys
  ◉ Storage: Configure a security rules file
  ◯ Emulators
  ◯ Remote Config

(Usa espacio para seleccionar, Enter para continuar)
```

### Selección de proyecto:
```
? Please select an option:
❯ Use an existing project

? Select a default Firebase project:
❯ worklish-XXXXX (WORKLISH)
```

### Configuración de Firestore:
```
? What file should be used for Firestore Rules? 
❯ firestore.rules (Enter para aceptar)

? What file should be used for Firestore indexes?
❯ firestore.indexes.json (Enter para aceptar)
```

### Configuración de Functions:
```
? What language would you like to use?
❯ JavaScript

? Do you want to use ESLint?
❯ No

? Do you want to install dependencies now?
❯ Yes
```

### Configuración de Hosting:
```
? What do you want to use as your public directory?
❯ frontend/build

? Configure as a single-page app (rewrite all urls to /index.html)?
❯ Yes

? Set up automatic builds and deploys with GitHub?
❯ No
```

## 6.3 Verificar archivos creados

Después de la inicialización, deberías tener:

```
worklish/
├── firebase.json           ✅ CREADO
├── .firebaserc             ✅ CREADO
├── firestore.rules         ✅ CREADO
├── firestore.indexes.json  ✅ CREADO
├── functions/              ✅ CREADO
│   ├── index.js
│   ├── package.json
│   └── node_modules/
├── backend/
└── frontend/
```

---

# 7. PASO 5: MIGRAR EL BACKEND

## 7.1 Instalar dependencias de Cloud Functions

```bash
# Entrar a la carpeta functions
cd functions

# Instalar dependencias de Google Cloud
npm install @google-cloud/speech
npm install @google-cloud/text-to-speech
npm install @google/generative-ai
npm install firebase-admin
npm install firebase-functions
npm install cors
npm install busboy

# Verificar package.json
cat package.json
```

## 7.2 Configurar variables de entorno

```bash
# Configurar la API Key de Gemini
firebase functions:config:set gemini.api_key="TU_GEMINI_API_KEY_AQUI"

# Verificar configuración
firebase functions:config:get
```

## 7.3 Copiar el archivo de credenciales

1. Copia el archivo JSON de la cuenta de servicio que descargaste al directorio `functions/`
2. Renómbralo a `service-account.json`

```bash
# Copiar archivo (ajusta la ruta)
cp ~/Downloads/worklish-xxxxx-firebase-adminsdk-xxxxx.json functions/service-account.json
```

## 7.4 Crear el archivo de Cloud Functions

Reemplaza el contenido de `functions/index.js` con el siguiente código:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const Busboy = require('busboy');

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

// Inicializar Speech clients
const speechClient = new speech.SpeechClient({
  keyFilename: './service-account.json'
});
const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFilename: './service-account.json'
});

// ============ HELPER: Verificar autenticación ============
const verifyAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token');
  }
  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken;
};

// ============ API: Health Check ============
exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.json({ status: 'healthy', version: '2.0.0-firebase' });
  });
});

// ============ API: Práctica de Texto ============
exports.practiceText = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Verificar autenticación
      const user = await verifyAuth(req);
      
      const { text, context, feedback_language } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      // Determinar idioma de feedback
      const feedbackLang = feedback_language || 'es';
      const tipsInstruction = feedbackLang === 'es' 
        ? 'Write all tips and feedback in SPANISH (español), but keep the corrected text in English.'
        : 'Write all tips and feedback in English.';

      // Llamar a Gemini
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are a professional English business writing coach. 
${tipsInstruction}

Context: ${context || 'professional email'}

Please review and correct this business text:
"${text}"

Respond ONLY with valid JSON in this exact format:
{
  "corrected_text": "the corrected version IN ENGLISH",
  "tips": ["tip1", "tip2", "tip3"],
  "grammar_score": 85,
  "vocabulary_score": 80
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let responseText = response.text();
      
      // Limpiar respuesta JSON
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0];
      } else if (responseText.includes('```')) {
        responseText = responseText.split('```')[1].split('```')[0];
      }
      
      const data = JSON.parse(responseText.trim());
      
      // Guardar en Firestore (opcional)
      await db.collection('practices').add({
        userId: user.uid,
        type: 'text',
        original: text,
        corrected: data.corrected_text,
        score: Math.round((data.grammar_score + data.vocabulary_score) / 2),
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        original_text: text,
        corrected_text: data.corrected_text,
        tips: data.tips,
        grammar_score: data.grammar_score,
        vocabulary_score: data.vocabulary_score
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ API: Práctica de Voz (Speech-to-Text) ============
exports.practiceVoice = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const user = await verifyAuth(req);

      // Parsear multipart form data
      const busboy = Busboy({ headers: req.headers });
      let audioBuffer = null;
      let expectedText = '';
      let context = 'business conversation';

      await new Promise((resolve, reject) => {
        busboy.on('file', (fieldname, file, info) => {
          const chunks = [];
          file.on('data', (chunk) => chunks.push(chunk));
          file.on('end', () => {
            audioBuffer = Buffer.concat(chunks);
          });
        });

        busboy.on('field', (fieldname, value) => {
          if (fieldname === 'expected_text') expectedText = value;
          if (fieldname === 'context') context = value;
        });

        busboy.on('finish', resolve);
        busboy.on('error', reject);

        if (req.rawBody) {
          busboy.end(req.rawBody);
        } else {
          req.pipe(busboy);
        }
      });

      if (!audioBuffer) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      // Transcribir con Google Speech-to-Text
      const [transcription] = await speechClient.recognize({
        audio: { content: audioBuffer.toString('base64') },
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
        },
      });

      const transcribedText = transcription.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');

      // Obtener feedback con Gemini
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are a pronunciation coach. Analyze this transcribed speech.
Context: ${context}
Transcribed speech: "${transcribedText}"
${expectedText ? `Expected text: "${expectedText}"` : ''}

Respond ONLY with valid JSON:
{
  "pronunciation_feedback": "overall feedback",
  "tips": ["tip1", "tip2"],
  "accuracy_score": 85
}`;

      const result = await model.generateContent(prompt);
      let feedbackText = (await result.response).text();
      
      if (feedbackText.includes('```json')) {
        feedbackText = feedbackText.split('```json')[1].split('```')[0];
      }
      
      const feedback = JSON.parse(feedbackText.trim());

      res.json({
        transcribed_text: transcribedText,
        pronunciation_feedback: feedback.pronunciation_feedback,
        tips: feedback.tips,
        accuracy_score: feedback.accuracy_score
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ API: Video Call (Conversación con IA) ============
exports.videoCall = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const user = await verifyAuth(req);
      
      const { user_message, conversation_history, scenario, feedback_language } = req.body;
      
      if (!user_message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const feedbackLang = feedback_language || 'es';
      const tipsInstruction = feedbackLang === 'es'
        ? 'Write tips and corrections in SPANISH, but keep ai_response in English.'
        : 'Write everything in English.';

      // Construir historial
      let historyText = '';
      if (conversation_history && conversation_history.length > 0) {
        historyText = conversation_history.slice(-6).map(msg => 
          `${msg.role}: ${msg.content}`
        ).join('\n');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are an AI English tutor in a ${scenario || 'job interview'} scenario.
${tipsInstruction}

Previous conversation:
${historyText}

User says: "${user_message}"

Respond ONLY with valid JSON:
{
  "ai_response": "your response IN ENGLISH as the character",
  "tips": ["tip if needed"],
  "corrections": ["correction if needed"]
}`;

      const result = await model.generateContent(prompt);
      let responseText = (await result.response).text();
      
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0];
      }
      
      const data = JSON.parse(responseText.trim());

      // Generar audio con Text-to-Speech
      let audioBase64 = null;
      try {
        const [ttsResponse] = await ttsClient.synthesizeSpeech({
          input: { text: data.ai_response },
          voice: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
          audioConfig: { audioEncoding: 'MP3' },
        });
        audioBase64 = ttsResponse.audioContent.toString('base64');
      } catch (ttsError) {
        console.warn('TTS error:', ttsError.message);
      }

      res.json({
        ai_response: data.ai_response,
        audio_base64: audioBase64,
        tips: data.tips || [],
        corrections: data.corrections || []
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ API: Text-to-Speech ============
exports.textToSpeech = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      await verifyAuth(req);
      
      const { text, language } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const [response] = await ttsClient.synthesizeSpeech({
        input: { text },
        voice: { 
          languageCode: language || 'en-US', 
          name: 'en-US-Neural2-F' 
        },
        audioConfig: { audioEncoding: 'MP3' },
      });

      res.json({
        audio_base64: response.audioContent.toString('base64')
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ API: Obtener perfil de usuario ============
exports.getUserProfile = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const user = await verifyAuth(req);
      
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Crear perfil si no existe
        const newProfile = {
          email: user.email,
          name: user.name || user.email.split('@')[0],
          subscription_status: 'trial',
          subscription_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_at: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(user.uid).set(newProfile);
        return res.json({ id: user.uid, ...newProfile });
      }
      
      res.json({ id: user.uid, ...userDoc.data() });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});
```

## 7.5 Actualizar package.json de Functions

Asegúrate de que `functions/package.json` tenga las dependencias correctas:

```json
{
  "name": "worklish-functions",
  "description": "WORKLISH Cloud Functions",
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "@google-cloud/speech": "^6.0.0",
    "@google-cloud/text-to-speech": "^5.0.0",
    "@google/generative-ai": "^0.2.0",
    "busboy": "^1.6.0",
    "cors": "^2.8.5",
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.5.0"
  }
}
```

Instalar dependencias:
```bash
cd functions
npm install
```

---

# 8. PASO 6: MIGRAR EL FRONTEND

## 8.1 Instalar Firebase en el Frontend

```bash
# Volver a la carpeta frontend
cd ../frontend

# Instalar Firebase SDK
npm install firebase
# o con yarn:
yarn add firebase
```

## 8.2 Crear archivo de configuración de Firebase

Crea el archivo `frontend/src/lib/firebase.js`:

```javascript
// frontend/src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// ⚠️ REEMPLAZA CON TU CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "worklish-XXXXX.firebaseapp.com",
  projectId: "worklish-XXXXX",
  storageBucket: "worklish-XXXXX.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// URL de Cloud Functions
const FUNCTIONS_URL = 'https://us-central1-worklish-XXXXX.cloudfunctions.net';

// ============ AUTH FUNCTIONS ============

export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const registerWithEmail = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Crear perfil en Firestore
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    name: name,
    subscription_status: 'trial',
    subscription_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created_at: new Date()
  });
  
  return user;
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Verificar/crear perfil
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      name: user.displayName,
      subscription_status: 'trial',
      subscription_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      created_at: new Date()
    });
  }
  
  return user;
};

export const logout = () => signOut(auth);

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

// ============ API FUNCTIONS ============

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  
  const response = await fetch(`${FUNCTIONS_URL}/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
};

export const practiceText = (text, context, feedbackLanguage) => {
  return apiRequest('practiceText', {
    method: 'POST',
    body: JSON.stringify({ text, context, feedback_language: feedbackLanguage })
  });
};

export const practiceVoice = async (audioBlob, expectedText, context) => {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'recording.webm');
  if (expectedText) formData.append('expected_text', expectedText);
  formData.append('context', context);
  
  const response = await fetch(`${FUNCTIONS_URL}/practiceVoice`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (!response.ok) throw new Error('Voice practice failed');
  return response.json();
};

export const videoCall = (userMessage, conversationHistory, scenario, feedbackLanguage) => {
  return apiRequest('videoCall', {
    method: 'POST',
    body: JSON.stringify({
      user_message: userMessage,
      conversation_history: conversationHistory,
      scenario,
      feedback_language: feedbackLanguage
    })
  });
};

export const textToSpeech = (text, language = 'en-US') => {
  return apiRequest('textToSpeech', {
    method: 'POST',
    body: JSON.stringify({ text, language })
  });
};

export default app;
```

## 8.3 Actualizar utils.js

Reemplaza `frontend/src/lib/utils.js`:

```javascript
// frontend/src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Progress helpers (stored locally)
export const getProgress = () => {
  const progress = localStorage.getItem('worklish_progress');
  return progress ? JSON.parse(progress) : {
    textSessions: 0,
    voiceSessions: 0,
    videoSessions: 0,
    totalMinutes: 0,
    averageScore: 0,
    streak: 0,
    lastPractice: null,
    history: []
  };
};

export const updateProgress = (type, score) => {
  const progress = getProgress();
  const now = new Date().toISOString();
  
  progress[`${type}Sessions`] = (progress[`${type}Sessions`] || 0) + 1;
  progress.totalMinutes = (progress.totalMinutes || 0) + 5;
  
  const totalSessions = progress.textSessions + progress.voiceSessions + progress.videoSessions;
  progress.averageScore = Math.round(
    ((progress.averageScore * (totalSessions - 1)) + score) / totalSessions
  );
  
  const lastPractice = progress.lastPractice ? new Date(progress.lastPractice) : null;
  const today = new Date();
  if (lastPractice) {
    const diffDays = Math.floor((today - lastPractice) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      progress.streak = (progress.streak || 0) + 1;
    } else if (diffDays > 1) {
      progress.streak = 1;
    }
  } else {
    progress.streak = 1;
  }
  
  progress.lastPractice = now;
  progress.history = [
    { type, score, date: now },
    ...(progress.history || []).slice(0, 49)
  ];
  
  localStorage.setItem('worklish_progress', JSON.stringify(progress));
  return progress;
};

// Language level helpers
export const getLanguageLevel = () => {
  return localStorage.getItem('worklish_language_level') || 'beginner';
};

export const setLanguageLevel = (level) => {
  localStorage.setItem('worklish_language_level', level);
};
```

## 8.4 Crear AuthContext para Firebase

Crea `frontend/src/contexts/AuthContext.jsx`:

```javascript
// frontend/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  logout as firebaseLogout,
  db 
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Cargar perfil de Firestore
        const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (profileDoc.exists()) {
          setUserProfile({ id: firebaseUser.uid, ...profileDoc.data() });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const user = await loginWithEmail(email, password);
    return user;
  };

  const register = async (email, password, name) => {
    const user = await registerWithEmail(email, password, name);
    return user;
  };

  const googleLogin = async () => {
    const user = await loginWithGoogle();
    return user;
  };

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
    setUserProfile(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    googleLogin,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
```

## 8.5 Actualizar App.js

```javascript
// frontend/src/App.js
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TextPractice from "./pages/TextPractice";
import VoicePractice from "./pages/VoicePractice";
import VideoCall from "./pages/VideoCall";
import Settings from "./pages/Settings";

// Context
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Auth guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <div className="text-white">Cargando...</div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/practice/text" element={<ProtectedRoute><TextPractice /></ProtectedRoute>} />
        <Route path="/practice/voice" element={<ProtectedRoute><VoicePractice /></ProtectedRoute>} />
        <Route path="/practice/video" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <div className="App">
          <Toaster position="top-center" richColors />
          <AppRoutes />
        </div>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
```

---

# 9. PASO 7: CONFIGURAR FIREBASE STUDIO

## 9.1 Abrir Firebase Studio

1. Ve a: **https://idx.google.com/** (Firebase Studio / Project IDX)
2. Inicia sesión con tu cuenta de Google
3. Clic en **"New project"** → **"Import from GitHub"**

## 9.2 Importar desde GitHub

```
1. Autoriza el acceso a GitHub si es necesario
2. Selecciona tu repositorio: worklish
3. Clic en "Import"
4. Espera a que se configure el workspace
```

## 9.3 Configurar el entorno en Firebase Studio

Una vez abierto el proyecto, ejecuta en la terminal:

```bash
# 1. Instalar dependencias del frontend
cd frontend
npm install

# 2. Instalar dependencias de functions
cd ../functions
npm install

# 3. Autenticarte en Firebase
firebase login --no-localhost

# Sigue las instrucciones para autenticarte

# 4. Verificar proyecto
firebase projects:list
```

## 9.4 Configurar variables de entorno

En Firebase Studio, crea el archivo `.env` en `frontend/`:

```bash
# frontend/.env
REACT_APP_FIREBASE_API_KEY=TU_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=worklish-XXXXX.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=worklish-XXXXX
REACT_APP_FIREBASE_STORAGE_BUCKET=worklish-XXXXX.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_FUNCTIONS_URL=https://us-central1-worklish-XXXXX.cloudfunctions.net
```

## 9.5 Probar localmente

```bash
# En una terminal, iniciar el emulador de Functions
cd functions
firebase emulators:start --only functions

# En otra terminal, iniciar el frontend
cd frontend
npm start
```

---

# 10. PASO 8: DEPLOY A FIREBASE HOSTING

## 10.1 Construir el Frontend

```bash
cd frontend
npm run build
```

## 10.2 Deploy de Cloud Functions

```bash
cd ../functions
firebase deploy --only functions
```

Verás algo como:
```
✔ Deploy complete!

Function URL (health): https://us-central1-worklish-XXXXX.cloudfunctions.net/health
Function URL (practiceText): https://us-central1-worklish-XXXXX.cloudfunctions.net/practiceText
Function URL (practiceVoice): https://us-central1-worklish-XXXXX.cloudfunctions.net/practiceVoice
Function URL (videoCall): https://us-central1-worklish-XXXXX.cloudfunctions.net/videoCall
```

## 10.3 Actualizar URL en el Frontend

Actualiza `frontend/src/lib/firebase.js` con la URL real:

```javascript
const FUNCTIONS_URL = 'https://us-central1-worklish-XXXXX.cloudfunctions.net';
```

Reconstruir:
```bash
cd frontend
npm run build
```

## 10.4 Deploy del Frontend

```bash
cd ..
firebase deploy --only hosting
```

Resultado:
```
✔ Deploy complete!

Hosting URL: https://worklish-XXXXX.web.app
```

## 10.5 Deploy Completo (Todo junto)

```bash
# Desde la raíz del proyecto
firebase deploy
```

---

# 11. SOLUCIÓN DE PROBLEMAS

## Error: "Permission denied" en Cloud Functions

```bash
# Verificar que las APIs estén habilitadas
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Error: "Invalid API key"

1. Ve a Google Cloud Console → Credenciales
2. Verifica que la API key tenga las APIs correctas habilitadas
3. Regenera la key si es necesario

## Error: "CORS policy"

Verifica que `cors` esté configurado correctamente en `functions/index.js`:

```javascript
const cors = require('cors')({ origin: true });

exports.myFunction = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // tu código
  });
});
```

## Error: "Firebase Auth - User not found"

```bash
# Verificar que Authentication esté habilitado
# En Firebase Console → Authentication → Sign-in method
# Habilitar "Email/Password"
```

## Error al subir audio (413 Payload Too Large)

Edita `firebase.json`:

```json
{
  "functions": {
    "source": "functions",
    "predeploy": [],
    "runtime": "nodejs18",
    "maxInstances": 10
  },
  "hosting": {
    "public": "frontend/build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

---

# 12. COMANDOS RÁPIDOS DE REFERENCIA

## Firebase CLI

```bash
# Login
firebase login

# Ver proyectos
firebase projects:list

# Seleccionar proyecto
firebase use worklish-XXXXX

# Deploy todo
firebase deploy

# Deploy solo functions
firebase deploy --only functions

# Deploy solo hosting
firebase deploy --only hosting

# Ver logs de functions
firebase functions:log

# Emuladores locales
firebase emulators:start
```

## Google Cloud CLI

```bash
# Login
gcloud auth login

# Listar proyectos
gcloud projects list

# Seleccionar proyecto
gcloud config set project worklish-XXXXX

# Habilitar API
gcloud services enable NOMBRE_API.googleapis.com

# Ver APIs habilitadas
gcloud services list --enabled
```

## npm/yarn

```bash
# Instalar dependencias
npm install
# o
yarn install

# Construir para producción
npm run build

# Ejecutar en desarrollo
npm start
```

---

# ✅ CHECKLIST FINAL

Antes de considerar la migración completa, verifica:

- [ ] Firebase Authentication configurado
- [ ] Firestore Database creado
- [ ] Reglas de seguridad de Firestore publicadas
- [ ] APIs de Google Cloud habilitadas (Speech, TTS, Gemini)
- [ ] API Key de Gemini configurada
- [ ] Cuenta de servicio creada y JSON descargado
- [ ] Cloud Functions desplegadas
- [ ] Frontend construido y desplegado
- [ ] Probar login/registro
- [ ] Probar práctica de texto
- [ ] Probar práctica de voz
- [ ] Probar video llamada

---

# 📞 SOPORTE

Si encuentras problemas:

1. Revisa la sección de "Solución de Problemas"
2. Consulta la documentación oficial:
   - Firebase: https://firebase.google.com/docs
   - Google Cloud: https://cloud.google.com/docs
   - Gemini API: https://ai.google.dev/docs

---

**Documento creado para WORKLISH**
**Versión 1.0 - Marzo 2026**
