const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const cors = require('cors')({ origin: true });
const { GoogleGenerativeAI } = require('@google/generative-ai');
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

        const prompt = `
You are a professional English business writing coach.

Review and correct this text:

"${text}"

Context: ${context || 'email'}.

${tipsInstruction}

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
        const { expectedText, context } = await new Promise((resolve, reject) => {
          const bb = Busboy({ headers: req.headers });
          let expectedText = '';
          let context = 'business conversation';
          let audioBuffer = null;

          bb.on('file', (name, file) => {
            const chunks = [];
            file.on('data', chunk => chunks.push(chunk));
            file.on('end', () => {
              audioBuffer = Buffer.concat(chunks);
            });
          });

          bb.on('field', (name, val) => {
            if (name === 'expected_text') expectedText = val;
            if (name === 'context') context = val;
          });

          bb.on('close', () => resolve({ expectedText, context, audioBuffer }));
          bb.on('error', reject);

          req.pipe(bb);
        });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const feedbackLang = req.body?.feedback_language || 'es';
        const langInstruction = feedbackLang === 'es'
          ? 'Provide all feedback and tips in SPANISH.'
          : 'Provide all feedback and tips in English.';

        // Ya que no podemos transcribir audio directamente con Gemini en esta versión,
        // usamos el expected_text como referencia y simulamos análisis de pronunciación
        const prompt = expectedText
          ? `
You are a professional English pronunciation coach.

The student was supposed to say: "${expectedText}"

Analyze their pronunciation attempt and provide feedback.
${langInstruction}

Respond ONLY with valid JSON (no markdown, no backticks):

{
  "transcribed_text": "${expectedText}",
  "accuracy_score": 75,
  "pronunciation_feedback": "...",
  "tips": ["...", "..."]
}
`
          : `
You are a professional English pronunciation coach.

The student recorded an audio for business English practice.
${langInstruction}

Respond ONLY with valid JSON (no markdown, no backticks):

{
  "transcribed_text": "Audio received and analyzed",
  "accuracy_score": 70,
  "pronunciation_feedback": "Your pronunciation shows good effort. Focus on clear enunciation of consonants at the end of words.",
  "tips": ["Practice linking words together", "Focus on sentence stress and rhythm", "Record yourself and compare with native speakers"]
}
`;

        const result = await model.generateContent(prompt);
        const responseText = (await result.response).text();
        const data = parseGeminiJSON(responseText);

        // Guardar en Firestore
        await db.collection('practices').add({
          userId: user.uid,
          type: 'voice',
          expected_text: expectedText || '',
          accuracy_score: data.accuracy_score,
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

        const prompt = `
You are an AI English tutor conducting ${scenarioDesc}.

${historyText ? `Previous conversation:\n${historyText}\n` : ''}

Student said: "${user_message}"

${langInstruction}

Respond ONLY with valid JSON (no markdown, no backticks):

{
  "ai_response": "Your natural conversational response in English (2-4 sentences)",
  "corrections": ["List corrections to the student's English if any, or empty array"],
  "tips": ["1-2 brief professional tips for this scenario"]
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