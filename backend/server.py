from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
import io

# Emergent integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAISpeechToText

# ElevenLabs
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Environment variables
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
emergent_key = os.environ.get('EMERGENT_LLM_KEY')
jwt_secret = os.environ.get('JWT_SECRET_KEY', 'fallback_secret')

# MongoDB connection
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app
app = FastAPI(title="WORKLISH API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    subscription_status: str
    subscription_end: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TextPracticeRequest(BaseModel):
    text: str
    context: str = "professional email"  # email, report, presentation, meeting, etc.

class TextPracticeResponse(BaseModel):
    original_text: str
    corrected_text: str
    tips: List[str]
    grammar_score: int
    vocabulary_score: int

class VoicePracticeRequest(BaseModel):
    expected_text: Optional[str] = None
    context: str = "business conversation"

class VoicePracticeResponse(BaseModel):
    transcribed_text: str
    pronunciation_feedback: str
    tips: List[str]
    accuracy_score: int

class ConversationMessage(BaseModel):
    role: str
    content: str

class VideoCallRequest(BaseModel):
    user_message: str
    conversation_history: List[ConversationMessage] = []
    scenario: str = "job interview"

class VideoCallResponse(BaseModel):
    ai_response: str
    audio_base64: Optional[str] = None
    tips: List[str]
    corrections: List[str]

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "subscription_status": "trial",
        "subscription_end": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            subscription_status="trial",
            subscription_end=user_doc["subscription_end"],
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            subscription_status=user["subscription_status"],
            subscription_end=user.get("subscription_end"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        subscription_status=current_user["subscription_status"],
        subscription_end=current_user.get("subscription_end"),
        created_at=current_user["created_at"]
    )

# ===================== TEXT PRACTICE =====================

@api_router.post("/practice/text", response_model=TextPracticeResponse)
async def practice_text(request: TextPracticeRequest, current_user: dict = Depends(get_current_user)):
    try:
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"text-{current_user['id']}-{uuid.uuid4()}",
            system_message="""You are a professional English business writing coach. Your role is to:
1. Correct grammar, spelling, and punctuation errors
2. Improve vocabulary for professional business contexts
3. Suggest better phrasing for business communication
4. Provide clear, actionable tips

Always respond in JSON format with these exact keys:
{
    "corrected_text": "the corrected version of the text",
    "tips": ["tip1", "tip2", "tip3"],
    "grammar_score": 85,
    "vocabulary_score": 80
}

The scores should be 0-100. Focus on business English for the workplace."""
        ).with_model("gemini", "gemini-3-flash-preview")

        user_message = UserMessage(
            text=f"""Context: {request.context}

Please review and correct this business text:
"{request.text}"

Provide corrections and tips for professional business English."""
        )

        response = await chat.send_message(user_message)
        
        # Parse response
        import json
        try:
            # Try to extract JSON from response
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            data = json.loads(response_text)
            
            return TextPracticeResponse(
                original_text=request.text,
                corrected_text=data.get("corrected_text", request.text),
                tips=data.get("tips", ["Keep practicing!"]),
                grammar_score=data.get("grammar_score", 70),
                vocabulary_score=data.get("vocabulary_score", 70)
            )
        except json.JSONDecodeError:
            return TextPracticeResponse(
                original_text=request.text,
                corrected_text=response,
                tips=["Keep practicing professional writing!", "Review business vocabulary"],
                grammar_score=75,
                vocabulary_score=75
            )
            
    except Exception as e:
        logger.error(f"Text practice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== VOICE PRACTICE =====================

@api_router.post("/practice/voice", response_model=VoicePracticeResponse)
async def practice_voice(
    audio_file: UploadFile = File(...),
    expected_text: Optional[str] = Form(None),
    context: str = Form("business conversation"),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Read audio file
        audio_content = await audio_file.read()
        
        # Transcribe with Whisper
        stt = OpenAISpeechToText(api_key=emergent_key)
        
        transcription = await stt.transcribe(
            file=io.BytesIO(audio_content),
            model="whisper-1",
            language="en",
            response_format="json"
        )
        
        transcribed_text = transcription.text
        
        # Get pronunciation feedback with Gemini
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"voice-{current_user['id']}-{uuid.uuid4()}",
            system_message="""You are a professional English pronunciation and speaking coach for business professionals. 
Analyze the transcribed speech and provide feedback.

Always respond in JSON format:
{
    "pronunciation_feedback": "overall feedback on speaking",
    "tips": ["tip1", "tip2", "tip3"],
    "accuracy_score": 85
}

Score 0-100. Focus on clarity, professional tone, and business communication."""
        ).with_model("gemini", "gemini-3-flash-preview")

        prompt = f"""Context: {context}
Transcribed speech: "{transcribed_text}"
"""
        if expected_text:
            prompt += f'Expected text: "{expected_text}"\nCompare what was said vs what was expected.'

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        import json
        try:
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            data = json.loads(response_text)
            
            return VoicePracticeResponse(
                transcribed_text=transcribed_text,
                pronunciation_feedback=data.get("pronunciation_feedback", "Good effort!"),
                tips=data.get("tips", ["Keep practicing speaking clearly"]),
                accuracy_score=data.get("accuracy_score", 75)
            )
        except json.JSONDecodeError:
            return VoicePracticeResponse(
                transcribed_text=transcribed_text,
                pronunciation_feedback=response,
                tips=["Practice speaking slowly and clearly", "Focus on business vocabulary"],
                accuracy_score=75
            )
            
    except Exception as e:
        logger.error(f"Voice practice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== VIDEO CALL / CONVERSATION =====================

@api_router.post("/practice/video-call", response_model=VideoCallResponse)
async def video_call_practice(
    request: VideoCallRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Build conversation history
        history_text = ""
        if request.conversation_history:
            for msg in request.conversation_history[-6:]:  # Last 6 messages for context
                history_text += f"{msg.role}: {msg.content}\n"
        
        # Get AI response with corrections
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"video-{current_user['id']}-{uuid.uuid4()}",
            system_message=f"""You are an AI English tutor conducting a {request.scenario} practice session.
You play the role of a professional in this scenario while helping the user improve their business English.

Your responses should:
1. Stay in character for the {request.scenario} scenario
2. Be natural and conversational
3. Subtly correct any English mistakes the user makes
4. Provide tips for improvement

Always respond in JSON format:
{{
    "ai_response": "your conversational response as the character",
    "tips": ["tip about their English if needed"],
    "corrections": ["any corrections to what they said"]
}}

Be encouraging and professional. Keep responses concise (2-3 sentences max for the ai_response)."""
        ).with_model("gemini", "gemini-3-flash-preview")

        prompt = f"""Scenario: {request.scenario}

Previous conversation:
{history_text}

User says: "{request.user_message}"

Respond in character and provide any English corrections/tips."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        import json
        try:
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            data = json.loads(response_text)
            ai_response_text = data.get("ai_response", "Could you repeat that please?")
            tips = data.get("tips", [])
            corrections = data.get("corrections", [])
            
        except json.JSONDecodeError:
            ai_response_text = response
            tips = []
            corrections = []
        
        # Generate audio response with ElevenLabs (if key is available)
        audio_base64 = None
        elevenlabs_key = os.environ.get('ELEVENLABS_API_KEY')
        
        if elevenlabs_key:
            try:
                eleven_client = ElevenLabs(api_key=elevenlabs_key)
                
                audio_generator = eleven_client.text_to_speech.convert(
                    text=ai_response_text,
                    voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel voice
                    model_id="eleven_multilingual_v2",
                    voice_settings=VoiceSettings(
                        stability=0.7,
                        similarity_boost=0.8
                    )
                )
                
                audio_data = b""
                for chunk in audio_generator:
                    audio_data += chunk
                
                audio_base64 = base64.b64encode(audio_data).decode()
            except Exception as e:
                logger.warning(f"ElevenLabs TTS error: {e}")
        
        return VideoCallResponse(
            ai_response=ai_response_text,
            audio_base64=audio_base64,
            tips=tips,
            corrections=corrections
        )
            
    except Exception as e:
        logger.error(f"Video call error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== SUBSCRIPTION =====================

class SubscriptionUpdate(BaseModel):
    plan: str  # "free", "basic", "premium"

@api_router.post("/subscription/update")
async def update_subscription(
    data: SubscriptionUpdate,
    current_user: dict = Depends(get_current_user)
):
    # In production, this would integrate with Stripe/payment
    duration_days = {"free": 0, "basic": 30, "premium": 30}
    
    new_end = None
    if data.plan != "free":
        new_end = (datetime.now(timezone.utc) + timedelta(days=duration_days.get(data.plan, 30))).isoformat()
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "subscription_status": data.plan,
            "subscription_end": new_end
        }}
    )
    
    return {"message": "Subscription updated", "plan": data.plan}

# ===================== HEALTH CHECK =====================

@api_router.get("/")
async def root():
    return {"message": "WORKLISH API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
