const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const cors = require('cors')({ origin: true });
const { GoogleGenerativeAI } = require('@google/generative-ai');
// text-to-speech is loaded lazily in getTtsClient() to avoid deployment timeouts
const Busboy = require('busboy');

// INICIALIZAR FIREBASE ADMIN
admin.initializeApp();

const db = getFirestore('worklish');

// Helper: incrementar contadores globales de estadísticas
const incrementStats = async (score) => {
  try {
    const statsRef = db.collection('stats').doc('global');
    const updateData = {
      total_practices: admin.firestore.FieldValue.increment(1)
    };
    if (typeof score === 'number' && score > 0) {
      updateData.total_score_sum = admin.firestore.FieldValue.increment(score);
      updateData.total_score_count = admin.firestore.FieldValue.increment(1);
    }
    await statsRef.set(updateData, { merge: true });
  } catch (e) {
    console.error('Stats increment error:', e);
  }
};

// =======================================================
// GEMINI CONFIG
// =======================================================

let genAI;
const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("GEMINI_API_KEY not found in environment");
    // During deployment analysis, we might not have the key.
    // We return a mock or handle it inside the functions.
    return new GoogleGenerativeAI("DUMMY_KEY"); 
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
};

// CONFIGURACIÓN DE CREDENCIALES GOOGLE CLOUD:
// 1. Ve a Google Cloud Console -> APIs y Servicios -> Credenciales.
// 2. Crea una Cuenta de Servicio con el rol "Cloud Text-to-Speech API User".
// 3. Descarga el archivo JSON de la clave.
// 4. En Producción (Firebase), las funciones detectarán la cuenta de servicio automáticamente.
// 5. Para desarrollo local, usa: export GOOGLE_APPLICATION_CREDENTIALS="ruta/a/tu/clave.json"
let _ttsClient = null;
const getTtsClient = () => {
  if (!_ttsClient) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    _ttsClient = new textToSpeech.TextToSpeechClient();
  }
  return _ttsClient;
};

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 20,
  timeoutSeconds: 120,
  memory: '512MiB'
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
  
  cleanText = cleanText.trim();
  
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    // Fallback: Gemini a veces introduce saltos de línea o tabulaciones sin escapar dentro de los strings,
    // lo que rompe JSON.parse. Reemplazamos saltos de línea con espacio para sanear el JSON.
    console.warn("JSON Parse Error, attempting to clean control characters:", error.message);
    const sanitizedText = cleanText
      .replace(/\n/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, " ");
    return JSON.parse(sanitizedText);
  }
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

        const model = getGenAI().getGenerativeModel({ model: 'gemini-3.6-flash' });

        const formattingRule = 
          feedbackLang === 'es'
            ? `STRICT FORMATTING RULE (MANDATORY):
- You MUST wrap fragments in English (words or full phrases) in parentheses like (English fragment).
- CRITICAL: DO NOT wrap ANY Spanish text in parentheses. EVER.
- NEVER wrap Spanish titles, connectors, or translations in parentheses.
- Wrong: "(formal o casual)"
- Correct: "formal o casual"
- Example tip: "Deberías usar (schedule a meeting) en lugar de (make a talk)."`
            : 'Wrap English examples in parentheses like (example).';

        const prompt = `
You are a professional English business writing coach.

Review and correct this text:

"${text}"

Context: ${context || 'email'}.

${tipsInstruction}
${formattingRule}

Provide a "grammar_score" and a "vocabulary_score" between 0 and 100 based on the professional quality of the text.

Respond ONLY with valid JSON (no markdown, no backticks):

{
  "corrected_text": "...",
  "tips": ["...", "..."],
  "grammar_score": 85,
  "vocabulary_score": 70
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

        // Incrementar estadísticas globales
        const avgScore = Math.round((Number(data.grammar_score || 0) + Number(data.vocabulary_score || 0)) / 2);
        await incrementStats(avgScore);

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


        const model = getGenAI().getGenerativeModel({ model: 'gemini-3.6-flash' });

        const langInstruction = feedbackLanguage === 'en'
          ? 'Provide all feedback and tips in English.'
          : 'Provide all feedback and tips in SPANISH (español).';

        const formattingRule = 
          feedbackLanguage === 'en'
            ? 'Wrap English examples in parentheses like (example).'
            : `STRICT FORMATTING RULE (MANDATORY):
- You MUST wrap fragments in English (words or phrases) in parentheses like (English fragment).
- CRITICAL: DO NOT wrap ANY Spanish text in parentheses. EVER.
- NEVER wrap Spanish titles, connectors, or translations in parentheses.
- Wrong: "(formal o casual)"
- Correct: "formal o casual"
- Suggestions or corrections in English should be wrapped.`;

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

Provide an "accuracy_score" and a "fluency_score" (if possible) as integers between 0 and 100.

${langInstruction}
${formattingRule}

Respond ONLY with valid JSON:
{
  "transcribed_text": "...",
  "accuracy_score": 85,
  "fluency_score": 70,
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

        // Incrementar estadísticas globales
        await incrementStats(Number(data.accuracy_score || 0));

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
        const { user_message, conversation_history, scenario, feedback_language, level } = req.body;

        if (!user_message || user_message.trim() === '') {
          return res.status(400).json({ error: 'user_message is required' });
        }

        const feedbackLang = feedback_language || 'es';
        const userLevel = level || 'beginner';
        
        let langInstruction = '';
        if (userLevel === 'beginner') {
          langInstruction = 'The user is a BEGINNER. Provide all tips and corrections in SPANISH. VERY IMPORTANT: Speak in very simple English. For the AI conversation part, ALWAYS include a Spanish translation normally (NOT in parentheses). ONLY use parentheses for English words or phrases you want the user to practice.';
        } else if (userLevel === 'intermediate') {
          langInstruction = feedbackLang === 'es'
            ? 'The user is INTERMEDIATE. Keep the AI conversation in natural English. Provide tips and corrections in Spanish. ONLY use parentheses for English words/phrases.'
            : 'The user is INTERMEDIATE. Provide all tips, corrections, and the AI conversation in English. ONLY use parentheses for English words/phrases.';
        } else {
          langInstruction = 'The user is ADVANCED. Provide all tips, corrections, and the AI conversation entirely in Professional English. ONLY use parentheses for English words/phrases.';
        }

        const model = getGenAI().getGenerativeModel({ model: 'gemini-3.6-flash' });

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
            ? `STRICT FORMATTING RULE (MANDATORY):
- You MUST wrap fragments in English (words or full phrases) in parentheses like (English fragment).
- DO NOT wrap any Spanish text in parentheses.
- NEVER wrap Spanish labels like (Consejos:) or (Correcciones:).`
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
// HOW TO SAY
// =======================================================

exports.howToSay = onRequest(async (req, res) => {
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
            ? 'Provide the phrase in English, and explain usage/examples in SPANISH (español).'
            : 'Provide everything in English.';

        const model = getGenAI().getGenerativeModel({ model: 'gemini-3.6-flash' });

        const formattingRule = 
          feedbackLang === 'es'
            ? `STRICT FORMATTING RULE (MANDATORY):
- You MUST wrap fragments in English (words or full phrases) in parentheses like (English fragment).
- CRITICAL: DO NOT wrap ANY Spanish text in parentheses. EVER.
- NEVER wrap Spanish titles, connectors, or translations in parentheses.
- Wrong: "(formal o casual)"
- Correct: "formal o casual"
- Example: "La forma más común es (I would like to). Se usa en contextos formales como (meetings)."`
            : 'Wrap English examples in parentheses like (example).';

        const prompt = `
You are a professional English translation and usage expert.
A user wants to know how to say: "${text}"
Context provided: ${context || 'general conversation'}.

Task:
1. Provide the most natural and professional way to say it in English.
2. Provide 2-3 FULL ENGLISH examples of how to use the phrase in a complete sentence. DO NOT write the examples in Spanish. The entire sentence must be in English.
3. Give recommendations or alternative ways to say it depending on the tone (formal/casual).

${tipsInstruction}
${formattingRule}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "phrase": "The main English phrase (not in parentheses here, just the plain text)",
  "examples": ["Full English example sentence 1 using (the translated phrase)", "Full English example sentence 2 using (the translated phrase)"],
  "recommendations": "Advice with (English parts)"
}
`;

        const result = await model.generateContent(prompt);
        const responseText = (await result.response).text();
        const data = parseGeminiJSON(responseText);

        // Guardar en Firestore
        await db.collection('practices').add({
          userId: user.uid,
          type: 'how_to_say',
          original: text,
          context: context || 'general',
          phrase: data.phrase,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Incrementar estadísticas
        await incrementStats();

        return res.json(data);

      } catch (error) {
        console.error('howToSay Error:', error);
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

      // Mapeo de voces Gemini a Google Cloud TTS (Neural2)
      // Definimos una voz en inglés y su equivalente en español (mismo género y estilo similar)
      const voiceMap = {
        'orion': { languageCode: 'en-US', name: 'en-US-Neural2-I', spanishName: 'es-US-Neural2-B' }, // Male deeper
        'pegasus': { languageCode: 'en-US', name: 'en-US-Neural2-J', spanishName: 'es-US-Neural2-C' }, // Male calm
        'ursa': { languageCode: 'en-US', name: 'en-US-Neural2-H', spanishName: 'es-US-Neural2-A' }, // Female engaged
        'nova': { languageCode: 'en-US', name: 'en-US-Neural2-F', spanishName: 'es-ES-Neural2-C' }, // Female subtle
        'eclipse': { languageCode: 'en-US', name: 'en-US-Neural2-E', spanishName: 'es-ES-Neural2-D' } // Female energetic
      };

      const selectedVoice = voiceMap[voiceId?.toLowerCase()] || voiceMap['orion'];

      // 1. LIMPIEZA DE BASURA DE TEXTO (Regex)
      const clean_text_for_speech = (text) => {
        return text.replace(/\*+/g, '');
      };

      // Limpieza de emergencia inmediata
      const safeText = clean_text_for_speech(text);

      // 2. CONVERSIÓN A SSML BILINGÜE INTELIGENTE (Detecta inglés vs español)
      const convertToSSML = (rawText) => {
        let escaped = rawText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*/g, '');
        
        const segments = [];
        // Separamos por () y "" para identificar posibles frases en inglés
        const segRegex = /["(]([^")]+)[)"]|([^"(]+)/g;
        let match;
        while ((match = segRegex.exec(escaped)) !== null) {
          if (match[1] !== undefined) {
             const ext = match[1].trim();
             const hasSpanish = /[áéíóúñÁÉÍÓÚÑ¿¡]/.test(ext);
             segments.push({ text: ext, lang: hasSpanish ? 'es' : 'en' });
          } else if (match[2] && match[2].trim()) {
             segments.push({ text: match[2].trim(), lang: 'es' });
          }
        }

        if (segments.length === 0) {
           segments.push({ text: escaped, lang: 'es' });
        }

        // Corrección heurística inteligente
        segments.forEach(s => {
           // Si asignamos 'es' pero no tiene letras exclusivas en español y tiene palabras comunes en inglés, corregir a 'en'
           if (s.lang === 'es' && !/[áéíóúñÁÉÍÓÚÑ¿¡]/.test(s.text)) {
               if (/\b(the|is|are|you|and|in|to|for|with|it|this|that|of|your|my|can|will|do|we)\b/i.test(s.text)) {
                   s.lang = 'en';
               }
           }
           // Si asignamos 'en' pero tiene palabras exclusivas o letras en español
           if (s.lang === 'en') {
               if (/[áéíóúñÁÉÍÓÚÑ¿¡]/.test(s.text) || /\b(el|la|los|las|un|una|de|que|en|por|para|con|como|su|tu|es|son|ya)\b/i.test(s.text)) {
                   s.lang = 'es';
               }
           }
        });

        let ssml = '<speak><prosody rate="medium" pitch="0st">';
        segments.forEach(s => {
            if(!s.text) return;
            // Usamos la voz en inglés o su equivalente en español según el caso
            const voiceName = s.lang === 'en' ? selectedVoice.name : selectedVoice.spanishName;
            ssml += `<voice name="${voiceName}">${s.text}</voice> `;
        });
        ssml += '</prosody></speak>';
        return ssml;
      };

      const request = {
        input: { ssml: convertToSSML(safeText) },
        voice: { 
          // Voice fallback coincidente
          languageCode: selectedVoice.languageCode, 
          name: selectedVoice.name
        },
        audioConfig: { audioEncoding: 'MP3', pitch: 0, speakingRate: 1.0 },
      };

      const [response] = await getTtsClient().synthesizeSpeech(request);
      
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

// =======================================================
// GET PUBLIC STATS (No auth required - for Landing Page)
// =======================================================

exports.getPublicStats = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const statsDoc = await db.collection('stats').doc('global').get();
      
      if (!statsDoc.exists) {
        return res.json({
          total_users: 0,
          total_practices: 0,
          avg_score: 0
        });
      }

      const data = statsDoc.data();
      const totalUsers = data.total_users || 0;
      const totalPractices = data.total_practices || 0;
      const avgScore = data.total_score_count > 0 
        ? Math.round(data.total_score_sum / data.total_score_count)
        : 0;

      return res.json({
        total_users: totalUsers,
        total_practices: totalPractices,
        avg_score: avgScore
      });

    } catch (error) {
      console.error('getPublicStats Error:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});