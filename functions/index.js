const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Busboy = require('busboy');

// =======================================================
// INICIALIZAR FIREBASE ADMIN
// Conectando explícitamente a la base de datos "worklish"
// =======================================================

admin.initializeApp({
  projectId: 'worklish-app-v2'
});

const db = admin.firestore();
db.settings({
  databaseId: 'worklish'
});

// =======================================================
// GEMINI CONFIG
// =======================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("FATAL: GEMINI_API_KEY secret not found.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const functionConfig = {
  secrets: ['GEMINI_API_KEY']
};

// =======================================================
// HEALTH CHECK
// =======================================================

exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      status: 'healthy',
      version: '3.1.0',
      message: 'WORKLISH API running on Firebase'
    });
  });
});

// =======================================================
// PRACTICE TEXT
// =======================================================

exports.practiceText = functions
  .runWith(functionConfig)
  .https.onRequest(async (req, res) => {

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
            ? 'Write all tips and feedback in SPANISH (espanol), but keep the corrected text in English.'
            : 'Write all tips and feedback in English.';

        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash'
        });

        const prompt = `
You are a professional English business writing coach.

Review and correct this text:

"${text}"

Context: ${context || 'email'}.

${tipsInstruction}

Respond ONLY with valid JSON:

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

        res.json(data);

      } catch (error) {

        console.error('practiceText Error:', error);

        res.status(500).json({
          error: error.message
        });

      }

    });

  });

// =======================================================
// VERIFY AUTH
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
// PARSE GEMINI JSON
// =======================================================

const parseGeminiJSON = (text) => {

  let cleanText = text.trim();

  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7, cleanText.length - 3);
  }

  return JSON.parse(cleanText.trim());

};

// =======================================================
// PLACEHOLDER ENDPOINTS
// =======================================================

exports.getUserProfile = functions.https.onRequest((req, res) =>
  res.status(501).json({ error: "Not implemented in this deploy" })
);

exports.updateUserProfile = functions.https.onRequest((req, res) =>
  res.status(501).json({ error: "Not implemented in this deploy" })
);

exports.practiceVoice = functions.https.onRequest((req, res) =>
  res.status(501).json({ error: "Not implemented in this deploy" })
);

exports.videoCall = functions.https.onRequest((req, res) =>
  res.status(501).json({ error: "Not implemented in this deploy" })
);

exports.getPracticeHistory = functions.https.onRequest((req, res) =>
  res.status(501).json({ error: "Not implemented in this deploy" })
);

exports.updateSubscription = functions.https.onRequest((req, res) =>
  res.status(501).json({ error: "Not implemented in this deploy" })
);