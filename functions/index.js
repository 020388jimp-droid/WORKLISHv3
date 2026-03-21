const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const cors = require('cors')({ origin: true });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const textToSpeech = require('@google-cloud/text-to-speech');
const Busboy = require('busboy');

// INICIALIZAR FIREBASE ADMIN
admin.initializeApp();

const db = getFirestore('worklish');

// =======================================================
// GEMINI CONFIG
// =======================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("FATAL: GEMINI_API_KEY secret not found.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// CONFIGURACIÓN DE CREDENCIALES GOOGLE CLOUD:
// 1. Ve a Google Cloud Console -> APIs y Servicios -> Credenciales.
// 2. Crea una Cuenta de Servicio con el rol "Cloud Text-to-Speech API User".
// 3. Descarga el archivo JSON de la clave.
// 4. En Producción (Firebase), las funciones detectarán la cuenta de servicio automáticamente.
// 5. Para desarrollo local, usa: export GOOGLE_APPLICATION_CREDENTIALS="ruta/a/tu/clave.json"
const ttsClient = new textToSpeech.TextToSpeechClient();

setGlobalOptions({
  maxInstances: 20,
  timeoutSeconds: 120,
  memory: "512MiB"
});

// =======================================================
// VERIFY AUTH HELPER
// =======================================================

const verifyAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }
  const idToken = authHeader.split('Bearer ')[1];
  return await admin.auth().verifyIdToken(idToken);
};

// =======================================================
// PARSE GEMINI JSON HELPER
// =======================================================

const parseGeminiJSON = (text) => {
  let cleanText = text.trim();
  // Remover bloques de código markdown si los hay
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }
  return JSON.parse(cleanText.trim());
};

// =======================================================
// HEALTH CHECK
// =======================================================

exports.health = onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      status: 'healthy',
      version: '3.2.0',
      message: 'WORKLISH API running on Firebase'
    });
  });
});

// =======================================================
// PRACTICE TEXT
// =======================================================

exports.practiceText = onRequest(async (req, res) => {

    cors(req, res, async () => {

      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      try {
        const user = await verifyAuth(req);
        const { text, context, feedback_language } = req.body;

        if (!text || text.trim() === '') {
          return res.status(400).json({ error: 'Text is required' });
        }

        const feedbackLang = feedback_language || 'es';
        const tipsInstruction =
          feedbackLang === 'es'
            ? 'Write all tips and feedback in SPANISH (español), but keep the corrected text in English.'
            : 'Write all tips and feedback in English.';

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const formattingRule = 
          feedbackLang === 'es'
            ? 'STRICT FORMATTING RULE: In your tips, always wrap English words/phrases in parentheses like (English word). NEVER use parentheses for Spanish text. Spanish titles should be bold like **Título:** without parentheses.'
            : 'Wrap English examples in parentheses like (example).';

        const prompt = `
You are a professional English business writing coach.

Review and correct this text:

"${text}"

Context: ${context || 'email'}.

${tipsInstruction}
${formattingRule}

Respond ONLY with valid JSON (no markdown, no backticks):

{
  "corrected_text": "...",
  "tips": ["...", "..."],
  "grammar_score": 0,
  "vocabulary_score": 0
}
`;

        const result = await model.generateContent(prompt);
        const responseText = (await result.response).text();
        const data = parseGeminiJSON(responseText);

        // Guardar en Firestore
        await db.collection('practices').add({
          userId: user.uid,
          type: 'text',
          context: context || 'email',
          original: text,
          corrected: data.corrected_text,
          grammar_score: data.grammar_score,
          vocabulary_score: data.vocabulary_score,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json(data);

      } catch (error) {
        console.error('practiceText Error:', error);
        return res.status(500).json({ error: error.message });
      }

    });

  });

// =======================================================
// PRACTICE VOICE
// =======================================================

exports.practiceVoice = onRequest(async (req, res) => {
    cors(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      try {
        const user = await verifyAuth(req);

        // Parsear multipart/form-data con Busboy
        const { expectedText, context, audioBuffer, feedbackLanguage } = await new Promise((resolve, reject) => {
          const bb = Busboy({ headers: req.headers });
          let _expectedText = '';
          let _context = 'business conversation';
          let _audioBuffer = null;
          let _feedbackLanguage = 'es';
          const filePromises = [];

          bb.on('file', (name, file, info) => {
            console.log(`Receiving file: ${name}`);
            const chunks = [];
            const filePromise = new Promise((fileResolve) => {
              file.on('data', chunk => chunks.push(chunk));
              file.on('end', () => {
                _audioBuffer = Buffer.concat(chunks);
                console.log(`File ${name} received, size: ${_audioBuffer.length} bytes`);
                fileResolve();
              });
              file.on('error', (err) => {
                console.error(`File ${name} error:`, err);
                fileResolve(); // Resolve anyway to not hang
              });
            });
            filePromises.push(filePromise);
          });

          bb.on('field', (name, val) => {
            if (name === 'expected_text') _expectedText = val;
            if (name === 'context') _context = val;
            if (name === 'feedback_language') _feedbackLanguage = val;
          });

          bb.on('close', async () => {
            try {
              await Promise.all(filePromises);
              console.log("Busboy parsing complete.");
              resolve({ 
                expectedText: _expectedText, 
                context: _context, 
                audioBuffer: _audioBuffer,
                feedbackLanguage: _feedbackLanguage 
              });
            } catch (err) {
              reject(err);
            }
          });

          bb.on('error', (err) => {
            console.error("Busboy instance error:", err);
            reject(err);
          });

          // En Cloud Functions, usar rawBody si está disponible para evitar problemas de stream
          if (req.rawBody) {
            bb.end(req.rawBody);
          } else {
            req.pipe(bb);
          }
        });


        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const langInstruction = feedbackLanguage === 'en'
          ? 'Provide all feedback and tips in English.'
          : 'Provide all feedback and tips in SPANISH (español).';

        const formattingRule = 
          feedbackLanguage === 'en'
            ? 'Wrap English examples in parentheses like (example).'
            : 'STRICT FORMATTING RULE: In your feedback and tips, always wrap English words/phrases in parentheses like (English word). NEVER use parentheses for Spanish text. Spanish titles should be bold like **Título:** without parentheses.';

        const prompt = `
You are a professional English pronunciation coach.
Analyze the provided audio recording.

${expectedText ? `The student was trying to say: "${expectedText}"` : 'The student is practicing professional English.'}
Context: ${context}

Task:
1. Transcribe what the student actually said.
2. Rate their accuracy (0-100).
3. Provide helpful feedback on their pronunciation, stress, and intonation.
4. Give 2-3 specific tips to improve.

${langInstruction}
${formattingRule}

Respond ONLY with valid JSON:
{
  "transcribed_text": "...",
  "accuracy_score": 0,
  "pronunciation_feedback": "...",
  "tips": ["...", "..."]
}
`;

        let result;
        if (audioBuffer) {
          result = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: audioBuffer.toString('base64'),
                mimeType: 'audio/webm'
              }
            }
          ]);
        } else {
          // Fallback if no audio (should not happen normally)
          result = await model.generateContent(prompt);
        }

        const responseText = (await result.response).text();
        const data = parseGeminiJSON(responseText);

        // Guardar en Firestore
        await db.collection('practices').add({
          userId: user.uid,
          type: 'voice',
          context: context || 'business conversation',
          expected_text: expectedText || '',
          transcribed_text: data.transcribed_text,
          accuracy_score: data.accuracy_score || 0,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json(data);

      } catch (error) {
        console.error('practiceVoice Error:', error);
        return res.status(500).json({ error: error.message });
      }

    });

  });

// =======================================================
// VIDEO CALL / CONVERSACIÓN IA
// =======================================================

exports.videoCall = onRequest(async (req, res) => {

    cors(req, res, async () => {

      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      try {
        const user = await verifyAuth(req);
        const { user_message, conversation_history, scenario, feedback_language } = req.body;

        if (!user_message || user_message.trim() === '') {
          return res.status(400).json({ error: 'user_message is required' });
        }

        const feedbackLang = feedback_language || 'es';
        const langInstruction = feedbackLang === 'es'
          ? 'Provide all tips and corrections in SPANISH, but keep the AI conversation in English.'
          : 'Provide all tips, corrections, and the AI conversation in English.';

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Construir historial de conversación
        const historyText = (conversation_history || [])
          .map(msg => `${msg.role === 'assistant' ? 'AI' : 'Student'}: ${msg.content}`)
          .join('\n');

        const scenarioDescriptions = {
          'job interview': 'a job interview where you are the hiring manager',
          'salary negotiation': 'a salary negotiation meeting',
          'client meeting': 'a client business meeting',
          'team standup': 'a team daily standup meeting',
          'presentation': 'a business presentation session',
          'performance review': 'a quarterly performance review'
        };

        const scenarioDesc = scenarioDescriptions[scenario] || 'a professional business conversation';

        const formattingRule = 
          feedbackLang === 'es'
            ? 'STRICT FORMATTING RULE: In your response, tips, and corrections, always wrap English words/phrases in parentheses like (English word). NEVER use parentheses for Spanish text.'
            : 'Wrap English examples in parentheses like (example).';

        const prompt = `
You are an AI English tutor conducting ${scenarioDesc}.

${historyText ? `Previous conversation:\n${historyText}\n` : ''}

Student said: "${user_message}"

${langInstruction}
${formattingRule}

Respond ONLY with valid JSON (no markdown, no backticks):

{
  "ai_response": "...",
  "corrections": ["..."],
  "tips": ["..."]
}
`;

        const result = await model.generateContent(prompt);
        const responseText = (await result.response).text();
        const data = parseGeminiJSON(responseText);

        // Guardar sesión en Firestore
        await db.collection('practices').add({
          userId: user.uid,
          type: 'video',
          scenario: scenario || 'general',
          user_message,
          ai_response: data.ai_response,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json(data);

      } catch (error) {
        console.error('videoCall Error:', error);
        return res.status(500).json({ error: error.message });
      }

    });

  });

// =======================================================
// GET USER PROFILE
// =======================================================

exports.getUserProfile = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const user = await verifyAuth(req);
      const profileDoc = await db.collection('users').doc(user.uid).get();
      if (!profileDoc.exists) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      return res.json({ id: user.uid, ...profileDoc.data() });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

// =======================================================
// UPDATE USER PROFILE
// =======================================================

exports.updateUserProfile = onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
      const user = await verifyAuth(req);
      const allowedFields = ['name', 'language_level', 'notifications_enabled', 'feedback_language'];
      const updateData = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      await db.collection('users').doc(user.uid).set(updateData, { merge: true });
      return res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

// =======================================================
// GET PRACTICE HISTORY
// =======================================================

exports.getPracticeHistory = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const user = await verifyAuth(req);
      const limit = parseInt(req.query.limit) || 20;
      const type = req.query.type || null;

      let query = db.collection('practices').where('userId', '==', user.uid);
      if (type) {
        query = query.where('type', '==', type);
      }
      query = query.orderBy('timestamp', 'desc').limit(limit);

      const snapshot = await query.get();
      const practices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null
      }));

      return res.json({ practices });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

// =======================================================
// UPDATE SUBSCRIPTION
// =======================================================

exports.updateSubscription = onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
      const user = await verifyAuth(req);
      const { plan } = req.body;

      if (!['trial', 'monthly', 'yearly'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      const endDate = new Date();
      if (plan === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
      else if (plan === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setDate(endDate.getDate() + 7);

      await db.collection('users').doc(user.uid).set({
        subscription_status: plan === 'trial' ? 'trial' : 'active',
        subscription_plan: plan,
        subscription_end: endDate.toISOString()
      }, { merge: true });

      return res.json({ success: true, plan, subscription_end: endDate.toISOString() });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

// =======================================================
// GENERATE SPEECH (TTS Professional)
// =======================================================

exports.generateSpeech = onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
      const { text, voiceId } = req.body;
      if (!text) return res.status(400).send('Text is required');

      // Mapeo de voces Gemini a Google Cloud TTS (Neural2 y Journey de alta fidelidad)
      const voiceMap = {
        'orion': { languageCode: 'en-US', name: 'en-US-Journey-D' },
        'pegasus': { languageCode: 'en-US', name: 'en-US-Journey-F' },
        'ursa': { languageCode: 'en-US', name: 'en-US-Neural2-H' },
        'nova': { languageCode: 'en-US', name: 'en-US-Neural2-F' },
        'eclipse': { languageCode: 'en-US', name: 'en-US-Neural2-J' }
      };

      const selectedVoice = voiceMap[voiceId?.toLowerCase()] || voiceMap['orion'];

      // 1. LIMPIEZA DE BASURA DE TEXTO (Regex)
      const clean_text_for_speech = (text) => {
        return text.replace(/\*+/g, '');
      };

      // Limpieza de emergencia inmediata
      const safeText = clean_text_for_speech(text);

      // 2. CONVERSIÓN A SSML BILINGÜE INTELIGENTE (Regla de Hierro: Paréntesis)
      const convertToSSML = (rawText) => {
        // A. Limpiamos comillas del texto original
        let cleanBase = rawText.replace(/"/g, '');
        
        // B. Escapamos caracteres XML
        let escaped = cleanBase.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // C. Etiquetamos inglés BASADO EN PARÉNTESIS (Instrucción Punto 3222)
        // Solo etiquetamos como INGLÉS si está entre ( ) y NO tiene caracteres españoles
        let detected = escaped.replace(/\(([^)]+)\)/g, (match, content) => {
          const hasSpanishChars = /[áéíóúñÁÉÍÓÚÑ¿¡]/.test(content);
          if (hasSpanishChars) return `(${content})`; // Mantener paréntesis si es español (error de LLM)
          return `<voice name="en-US-Neural2-F">${content}</voice>`;
        });

        // D. Borramos asteriscos de formato restantes para que no se lean
        let finalSSML = detected.replace(/\*+/g, '').trim();

        return `<speak><prosody rate="medium" pitch="0st">${finalSSML}</prosody></speak>`;
      };

      const request = {
        input: { ssml: convertToSSML(text) },
        voice: { 
          languageCode: 'es-US', 
          name: 'es-US-Neural2-A'
        },
        audioConfig: { audioEncoding: 'MP3', pitch: 0, speakingRate: 1.0 },
      };

      const [response] = await ttsClient.synthesizeSpeech(request);
      
      // Enviamos el audio como base64 para que el navegador lo reproduzca fácilmente
      res.set('Content-Type', 'application/json');
      return res.json({ 
        audioContent: response.audioContent.toString('base64') 
      });

    } catch (error) {
      console.error('TTS Error:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});