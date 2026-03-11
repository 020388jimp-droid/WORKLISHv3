const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Busboy = require('busboy');

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Gemini API Key - Usar variable de entorno (.env en el directorio functions/)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ============ HELPER: Verificar autenticacion ============
const verifyAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }
  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken;
};

// ============ HELPER: Parsear respuesta JSON de Gemini ============
const parseGeminiJSON = (text) => {
  let cleanText = text.trim();
  if (cleanText.includes('```json')) {
    cleanText = cleanText.split('```json')[1].split('```')[0];
  } else if (cleanText.includes('```')) {
    cleanText = cleanText.split('```')[1].split('```')[0];
  }
  return JSON.parse(cleanText.trim());
};

// ============ API: Health Check ============
exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.json({ 
      status: 'healthy', 
      version: '2.0.0-firebase',
      message: 'WORKLISH API running on Firebase'
    });
  });
});

// ============ API: Obtener/Crear perfil de usuario ============
exports.getUserProfile = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const user = await verifyAuth(req);
      
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        const newProfile = {
          email: user.email,
          name: user.name || user.email?.split('@')[0] || 'Usuario',
          subscription_status: 'trial',
          subscription_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          language_level: 'beginner',
          created_at: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(user.uid).set(newProfile);
        return res.json({ id: user.uid, ...newProfile });
      }
      
      const userData = userDoc.data();
      res.json({ 
        id: user.uid, 
        email: userData.email,
        name: userData.name,
        subscription_status: userData.subscription_status,
        subscription_end: userData.subscription_end,
        language_level: userData.language_level,
        created_at: userData.created_at
      });

    } catch (error) {
      console.error('getUserProfile Error:', error);
      res.status(error.message.includes('token') ? 401 : 500).json({ error: error.message });
    }
  });
});

// ============ API: Actualizar perfil de usuario ============
exports.updateUserProfile = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const user = await verifyAuth(req);
      const { name, language_level } = req.body;
      
      const updates = {};
      if (name) updates.name = name;
      if (language_level) updates.language_level = language_level;
      updates.updated_at = admin.firestore.FieldValue.serverTimestamp();
      
      await db.collection('users').doc(user.uid).update(updates);
      
      res.json({ success: true, updated: updates });

    } catch (error) {
      console.error('updateUserProfile Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ API: Practica de Texto ============
exports.practiceText = functions.https.onRequest(async (req, res) => {
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
      const tipsInstruction = feedbackLang === 'es' 
        ? 'Write all tips and feedback in SPANISH (espanol), but keep the corrected text in English.'
        : 'Write all tips and feedback in English.';

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are a professional English business writing coach. Your role is to:
1. Correct grammar, spelling, and punctuation errors
2. Improve vocabulary for professional business contexts
3. Suggest better phrasing for business communication
4. Provide clear, actionable tips

${tipsInstruction}

Context: ${context || 'professional email'}

Please review and correct this business text:
"${text}"

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "corrected_text": "the corrected version of the text IN ENGLISH",
  "tips": ["tip1", "tip2", "tip3"],
  "grammar_score": 85,
  "vocabulary_score": 80
}

The scores should be 0-100. Be encouraging but accurate.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      const data = parseGeminiJSON(responseText);
      
      // Guardar en Firestore
      await db.collection('practices').add({
        userId: user.uid,
        type: 'text',
        context: context || 'professional email',
        original: text,
        corrected: data.corrected_text,
        grammar_score: data.grammar_score,
        vocabulary_score: data.vocabulary_score,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        original_text: text,
        corrected_text: data.corrected_text,
        tips: data.tips || [],
        grammar_score: data.grammar_score || 70,
        vocabulary_score: data.vocabulary_score || 70
      });

    } catch (error) {
      console.error('practiceText Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ API: Practica de Voz ============
exports.practiceVoice = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const user = await verifyAuth(req);

      // Parsear multipart form data
      const busboy = Busboy({ headers: req.headers });
      let audioBuffer = null;
      let expectedText = '';
      let context = 'business conversation';

      await new Promise((resolve, reject) => {
        busboy.on('file', (fieldname, file) => {
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

      // Transcribir audio con Gemini multimodal (si hay audio)
      let transcribedText = expectedText || '';
      
      if (audioBuffer && audioBuffer.length > 0) {
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const audioBase64 = audioBuffer.toString('base64');
          
          const transcriptionResult = await model.generateContent([
            'Transcribe the following audio to English text. Return ONLY the transcribed text, nothing else. If the audio is unclear, return your best interpretation.',
            {
              inlineData: {
                data: audioBase64,
                mimeType: 'audio/webm'
              }
            }
          ]);
          
          const transcription = transcriptionResult.response.text().trim();
          if (transcription && transcription.length > 0) {
            transcribedText = transcription;
          }
        } catch (transcriptionError) {
          console.warn('Audio transcription failed, using expected text:', transcriptionError.message);
          if (!transcribedText) {
            transcribedText = 'Audio transcription unavailable. Please provide expected text.';
          }
        }
      }

      if (!transcribedText) {
        return res.status(400).json({ error: 'No audio or expected text provided' });
      }

      // Obtener feedback con Gemini
      const feedbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are a pronunciation and speaking coach for business English.
Analyze this transcribed speech and provide feedback.

Context: ${context}
Transcribed speech: "${transcribedText}"
${expectedText ? `Expected text: "${expectedText}"` : ''}

Respond ONLY with valid JSON:
{
  "pronunciation_feedback": "overall feedback on the speaking",
  "tips": ["tip1", "tip2"],
  "accuracy_score": 85
}

Score should be 0-100. Be encouraging and helpful.`;

      const result = await feedbackModel.generateContent(prompt);
      const feedbackText = (await result.response).text();
      const feedback = parseGeminiJSON(feedbackText);

      // Guardar en Firestore
      await db.collection('practices').add({
        userId: user.uid,
        type: 'voice',
        context: context,
        transcribed: transcribedText,
        accuracy_score: feedback.accuracy_score,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        transcribed_text: transcribedText,
        pronunciation_feedback: feedback.pronunciation_feedback || 'Good effort!',
        tips: feedback.tips || [],
        accuracy_score: feedback.accuracy_score || 75
      });

    } catch (error) {
      console.error('practiceVoice Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ API: Video Call / Conversacion con IA ============
exports.videoCall = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const user = await verifyAuth(req);
      
      const { user_message, conversation_history, scenario, feedback_language } = req.body;
      
      if (!user_message || user_message.trim() === '') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const feedbackLang = feedback_language || 'es';
      const tipsInstruction = feedbackLang === 'es'
        ? 'Write tips and corrections in SPANISH (espanol), but keep the ai_response conversation in English since this is English practice.'
        : 'Write everything in English.';

      let historyText = '';
      if (conversation_history && conversation_history.length > 0) {
        historyText = conversation_history.slice(-6).map(msg => 
          `${msg.role === 'ai' || msg.role === 'assistant' ? 'AI Tutor' : 'Student'}: ${msg.content}`
        ).join('\n');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const scenarioDescriptions = {
        'job interview': 'a job interview where you are the interviewer',
        'salary negotiation': 'a salary negotiation meeting',
        'client meeting': 'a business meeting with a client',
        'team standup': 'a daily team standup meeting',
        'presentation': 'giving a business presentation',
        'performance review': 'a performance review meeting'
      };
      
      const scenarioDesc = scenarioDescriptions[scenario] || scenarioDescriptions['job interview'];
      
      const prompt = `You are an AI English tutor conducting ${scenarioDesc} practice session.
You play the role of a professional in this scenario while helping the user improve their business English.

Your responses should:
1. Stay in character for the ${scenario || 'job interview'} scenario
2. Be natural and conversational IN ENGLISH
3. Subtly note any English mistakes the user makes
4. Provide helpful tips for improvement

${tipsInstruction}

Previous conversation:
${historyText || 'This is the start of the conversation.'}

Student says: "${user_message}"

Respond ONLY with valid JSON (no markdown):
{
  "ai_response": "your conversational response IN ENGLISH as the character (2-3 sentences max)",
  "tips": ["tip about their English if needed"],
  "corrections": ["any corrections to what they said if needed"]
}

Be encouraging, professional, and keep the conversation flowing naturally.`;

      const result = await model.generateContent(prompt);
      const responseText = (await result.response).text();
      const data = parseGeminiJSON(responseText);

      // Guardar en Firestore
      await db.collection('practices').add({
        userId: user.uid,
        type: 'video',
        scenario: scenario || 'job interview',
        user_message: user_message,
        ai_response: data.ai_response,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        ai_response: data.ai_response || "I'm sorry, could you repeat that?",
        audio_base64: null,
        tips: data.tips || [],
        corrections: data.corrections || []
      });

    } catch (error) {
      console.error('videoCall Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ API: Obtener historial de practicas ============
exports.getPracticeHistory = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const user = await verifyAuth(req);
      
      const limit = parseInt(req.query.limit) || 20;
      const type = req.query.type;
      
      let query = db.collection('practices')
        .where('userId', '==', user.uid)
        .orderBy('timestamp', 'desc')
        .limit(limit);
      
      if (type) {
        query = query.where('type', '==', type);
      }
      
      const snapshot = await query.get();
      const practices = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        practices.push({
          id: doc.id,
          type: data.type,
          score: data.grammar_score || data.vocabulary_score || data.accuracy_score || 0,
          timestamp: data.timestamp?.toDate()?.toISOString() || new Date().toISOString()
        });
      });
      
      res.json({ practices });

    } catch (error) {
      console.error('getPracticeHistory Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ API: Actualizar suscripcion ============
exports.updateSubscription = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const user = await verifyAuth(req);
      const { plan } = req.body;
      
      const validPlans = ['free', 'basic', 'premium', 'trial'];
      if (!validPlans.includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' });
      }
      
      const durationDays = { free: 0, trial: 7, basic: 30, premium: 30 };
      const endDate = plan === 'free' ? null : 
        new Date(Date.now() + durationDays[plan] * 24 * 60 * 60 * 1000).toISOString();
      
      await db.collection('users').doc(user.uid).update({
        subscription_status: plan,
        subscription_end: endDate,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, plan, subscription_end: endDate });

    } catch (error) {
      console.error('updateSubscription Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});
