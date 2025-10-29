from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from PIL import Image
import io
import json
import torch
import os
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging
from collections import defaultdict

# Emotion Recognition
from hsemotion.facial_emotions import HSEmotionRecognizer

# Face Detection
from facenet_pytorch import MTCNN
import torch.nn as nn

# Local imports
from models import *
from auth_fixed import get_current_user, create_access_token, decode_access_token
from database import DatabaseService, SUPABASE_SERVICE_ROLE_KEY
from starlette.websockets import WebSocketState

app = FastAPI(
    title="MindBridge API",
    description="API for MindBridge - Emotion Detection and Therapy Management System",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize emotion detection models
print("Initializing emotion detection models...")
device = 'cuda' if torch.cuda.is_available() else 'cpu'

# Face detector
mtcnn = MTCNN(keep_all=True, device=device)

# Emotion recognizer
model_name = 'enet_b0_8_best_afew'
fer = HSEmotionRecognizer(model_name=model_name, device=device)

# Patch older checkpoints missing attributes introduced in newer timm versions.
def _patch_depthwise_layers(model):
    try:
        from timm.models._efficientnet_blocks import DepthwiseSeparableConv, InvertedResidual
    except Exception:
        DepthwiseSeparableConv = None
        InvertedResidual = None

    if DepthwiseSeparableConv is None and InvertedResidual is None:
        return

    def _ensure_attrs(module):
        if not hasattr(module, "conv_s2d"):
            module.conv_s2d = None
        if not hasattr(module, "bn_s2d"):
            module.bn_s2d = None
        if not hasattr(module, "aa"):
            module.aa = nn.Identity()
        if not hasattr(module, "drop_path"):
            module.drop_path = nn.Identity()

    for module in model.modules():
        if isinstance(module, DepthwiseSeparableConv) or (
            InvertedResidual is not None and isinstance(module, InvertedResidual)
        ):
            _ensure_attrs(module)

_patch_depthwise_layers(fer.model)

print("Models initialized!")

BIOMETRIC_STORAGE_ENABLED = True
EMOTION_AGGREGATION_INTERVAL = int(os.getenv("EMOTION_AGGREGATION_INTERVAL", "60"))
emotion_buffers: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
last_emotion_save: Dict[str, datetime] = {}

logger = logging.getLogger(__name__)


def _normalize_emotion(raw_emotion: str) -> str:
    mapping = {
        "happiness": "happy",
        "happy": "happy",
        "joy": "happy",
        "anger": "angry",
        "angry": "angry",
        "disgust": "disgust",
        "fear": "fear",
        "sadness": "sad",
        "sad": "sad",
        "surprise": "surprise",
        "neutral": "neutral",
        "contempt": "angry",
        "calm": "neutral",
    }
    key = (raw_emotion or "").strip().lower()
    return mapping.get(key, "neutral")


def _compute_biometric_from_emotion(emotion: str, confidence: float) -> Dict[str, Any]:
    emotion_stress_bias = {
        "angry": 0.9,
        "fear": 0.8,
        "disgust": 0.7,
        "sad": 0.6,
        "surprise": 0.5,
        "neutral": 0.3,
        "happy": 0.2,
    }
    stress_bias = emotion_stress_bias.get(emotion.lower(), 0.4)
    stress_score = min(max((confidence / 100.0 + stress_bias) / 2, 0.0), 1.0)
    if stress_score >= 0.66:
        stress_level = "high"
    elif stress_score >= 0.33:
        stress_level = "medium"
    else:
        stress_level = "low"

    heart_rate = int(65 + stress_score * 40)
    skin_temperature = round(36.3 + (stress_score - 0.5) * 0.8, 2)
    activity_state = "active" if stress_score >= 0.33 else "resting"

    return {
        "stress_level": stress_level,
        "heart_rate": heart_rate,
        "skin_temperature": skin_temperature,
        "activity": activity_state,
    }


def _normalize_preferences_value(value: Any) -> Optional[PreferencesType]:
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        if stripped.lower() in {"null", "none"}:
            return None
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
        return stripped
    if isinstance(value, dict):
        return value
    return value


def _prepare_preferences_for_storage(value: Any) -> Optional[str]:
    normalized = _normalize_preferences_value(value)
    if normalized is None:
        return None
    if isinstance(normalized, dict):
        if not normalized:
            return None
        return json.dumps(normalized, ensure_ascii=False)
    if isinstance(normalized, str):
        return normalized.strip() or None
    return str(normalized)


def _persist_emotion_snapshot(child_id: str, flush_timestamp: Optional[datetime] = None):
    global BIOMETRIC_STORAGE_ENABLED
    buffer = emotion_buffers.get(child_id)
    if not buffer:
        return

    totals: Dict[str, float] = defaultdict(float)
    counts: Dict[str, int] = defaultdict(int)
    face_counts: List[int] = []
    for entry in buffer:
        emotion = entry["emotion"]
        confidence = entry["confidence"]
        totals[emotion] += confidence
        counts[emotion] += 1
        face_counts.append(entry.get("face_count", 0))

    if not totals:
        return

    dominant_emotion = max(totals.items(), key=lambda x: x[1])[0]
    avg_confidence = totals[dominant_emotion] / counts[dominant_emotion]
    avg_face_count = int(round(sum(face_counts) / len(face_counts))) if face_counts else 0
    timestamp = flush_timestamp or datetime.utcnow()

    biometric_values = _compute_biometric_from_emotion(dominant_emotion, avg_confidence)

    biometric_record = {
        "child_id": child_id,
        "timestamp": timestamp.isoformat(),
        **biometric_values,
        "dominant_emotion": dominant_emotion,
        "dominant_confidence": avg_confidence,
        "face_count": avg_face_count,
    }

    try:
        if BIOMETRIC_STORAGE_ENABLED:
            DatabaseService.save_biometric_data(biometric_record)
            logger.debug(
                "Aggregated biometric data saved for child_id=%s emotion=%s confidence=%.2f stress=%s",
                child_id,
                dominant_emotion,
                avg_confidence,
                biometric_values["stress_level"],
            )
    except Exception as exc:
        logger.warning(f"Failed to save aggregated biometric data: {exc}")
        conflict_keys = {"dominant_emotion", "dominant_confidence", "face_count"}
        if any(key in str(exc) for key in conflict_keys):
            safe_record = {k: v for k, v in biometric_record.items() if k not in conflict_keys}
            try:
                DatabaseService.save_biometric_data(safe_record)
                logger.info("Saved biometric data without optional dominant metrics due to schema mismatch.")
            except Exception as inner_exc:
                logger.error(f"Failed to save fallback biometric data: {inner_exc}")
        else:
            logger.error("Disabling biometric persistence because of repeated failures.")
            BIOMETRIC_STORAGE_ENABLED = False

    try:
        emotion_record_payload = {
            "child_id": child_id,
            "emotion": dominant_emotion,
            "intensity": avg_confidence,
            "timestamp": timestamp.isoformat(),
        }
        DatabaseService.save_emotion_record(emotion_record_payload)
    except Exception as exc:
        logger.error(f"Failed to save aggregated emotion record: {exc}")

    emotion_buffers[child_id].clear()
    last_emotion_save[child_id] = timestamp

# Auth support endpoints
@app.post("/auth/confirm-email")
async def confirm_email(request):
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase service role key not configured; confirm the account directly from Supabase.",
        )
    try:
        DatabaseService.confirm_supabase_user(request.email)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )
    return {"message": "Email confirmed"}

@app.post("/auth/register", response_model=RegisterResponse)
async def register_user(payload: UserRegister):
    if not payload.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required for registration",
        )

    role = (payload.role or "").lower()
    if role not in {"psychologist", "child"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported role for registration",
        )

    existing_user = DatabaseService.get_user_by_email(payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    try:
        auth_user = DatabaseService.create_supabase_auth_user(
            payload.email,
            payload.password,
            {"role": role},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create Supabase auth user: {exc}",
        )

    auth_user_id = None
    if isinstance(auth_user, dict):
        auth_user_id = auth_user.get("id") or auth_user.get("user", {}).get("id")
    if not auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase did not return a user id",
        )

    user_profile = {
        "id": auth_user_id,
        "name": payload.name,
        "email": payload.email,
        "role": role,
    }

    try:
        created_user = DatabaseService.create_user(user_profile)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to persist user profile: {exc}",
        )

    if not created_user:
        created_user = DatabaseService.get_user_by_id(auth_user_id)
    if not created_user:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve user profile after creation",
        )

    if role == "psychologist":
        if not payload.license_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="license_number is required for psychologist registration",
            )
        specializations_raw = payload.specializations or []
        if isinstance(specializations_raw, (str, bytes)):
            specializations_list = [str(specializations_raw)]
        else:
            specializations_list = [str(item) for item in specializations_raw]
        psychologist_data = {
            "user_id": auth_user_id,
            "license_number": payload.license_number,
            "specializations": specializations_list,
            "assigned_children": [],
            "hospital": payload.hospital,
            "years_experience": payload.years_experience or 0,
            "phone_number": payload.phone_number,
            "sex": payload.sex,
            "date_of_birth": payload.date_of_birth.isoformat() if payload.date_of_birth else None,
            "address": payload.address,
        }
        try:
            DatabaseService.create_psychologist(psychologist_data)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to create psychologist profile: {exc}",
            )
    else:
        diagnosis_raw = payload.diagnosis or []
        diagnosis = [str(item) for item in diagnosis_raw]
        dob_value = payload.date_of_birth
        dob_date = None
        dob_iso = None
        if dob_value:
            if isinstance(dob_value, datetime):
                dob_date = dob_value.date()
            elif isinstance(dob_value, date):
                dob_date = dob_value
            else:
                try:
                    dob_str = str(dob_value)
                    if dob_str.endswith("Z"):
                        dob_str = dob_str.replace("Z", "+00:00")
                    dob_date = datetime.fromisoformat(dob_str).date()
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid date_of_birth format",
                    )
            dob_iso = dob_date.isoformat()

        age_value = payload.age
        if age_value is None and dob_date:
            today = date.today()
            age_value = today.year - dob_date.year - (
                (today.month, today.day) < (dob_date.month, dob_date.day)
            )

        if age_value is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Age is required for child registration",
            )

        payload_dict = payload.model_dump()
        parent_email = payload.parent_email or payload.guardian_email
        clinical_file = payload_dict.get("clinical_history_file")
        if clinical_file is not None and not isinstance(clinical_file, str):
            clinical_file = str(clinical_file)

        child_data = {
            "user_id": auth_user_id,
            "assigned_psychologist": None,
            "name": payload.name,
            "email": payload.email,
            "sex": payload.sex,
            "date_of_birth": dob_iso,
            "age": age_value,
            "address": payload.address,
            "guardian_name": payload.guardian_name,
            "guardian_phone": payload.guardian_phone,
            "guardian_email": payload.guardian_email,
            "parent_email": parent_email,
            "asd_level": payload.asd_level,
            "diagnosis": diagnosis,
            "clinical_history_file": clinical_file,
            "preferences": _prepare_preferences_for_storage(payload.preferences),
            "current_emotion": "neutral",
        }
        try:
            DatabaseService.create_child(child_data)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to create child profile: {exc}",
            )

    token_value = create_access_token({"sub": auth_user_id, "aud": "authenticated"})
    response_payload = {
        "token": {"access_token": token_value, "token_type": "bearer"},
        "user": created_user,
    }
    return response_payload

# Psychologist-managed child registration
@app.post("/psychologists/children", response_model=Child)
async def create_child_for_psychologist(
    payload: ChildRegistrationRequest,
    current_user: dict = Depends(get_current_user),
):  
    message = f"Authenticated psychologist {current_user}"
    logger.info(message)
    if current_user["role"] != "psychologist":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
    if not psychologist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Psychologist profile not found")

    existing_user = DatabaseService.get_user_by_email(payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    try:
        auth_user = DatabaseService.create_supabase_auth_user(
            payload.email,
            payload.password,
            {"role": "child"},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create Supabase auth user: {exc}",
        )

    auth_user_id = None
    if isinstance(auth_user, dict):
        auth_user_id = auth_user.get("id") or auth_user.get("user", {}).get("id")
    if not auth_user_id:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Supabase did not return a user id")

    user_profile = {
        "id": auth_user_id,
        "name": payload.name,
        "email": payload.email,
        "role": "child",
    }
    DatabaseService.create_user(user_profile)

    diagnosis_raw = payload.diagnosis or []
    diagnosis = [str(item) for item in diagnosis_raw]
    parent_email = payload.parent_email or payload.guardian_email
    child_data = {
        "user_id": auth_user_id,
        "assigned_psychologist": psychologist["id"],
        "name": payload.name,
        "email": payload.email,
        "sex": payload.sex,
        "date_of_birth": payload.date_of_birth.isoformat() if payload.date_of_birth else None,
        "age": payload.age,
        "address": payload.address,
        "guardian_name": payload.guardian_name,
        "guardian_phone": payload.guardian_phone,
        "guardian_email": payload.guardian_email,
        "parent_email": parent_email,
        "asd_level": payload.asd_level,
        "diagnosis": diagnosis,
        "clinical_history_file": payload.clinical_history_file,
        "preferences": _prepare_preferences_for_storage(payload.preferences),
        "current_emotion": "neutral",
    }
    created_child = DatabaseService.create_child(child_data)
    return created_child

# User management endpoints
@app.get("/users/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=User)
async def update_current_user(user_update: UserBase, current_user: dict = Depends(get_current_user)):
    updated_user = DatabaseService.update_user(current_user["id"], user_update.dict())
    return updated_user

@app.delete("/users/me")
async def delete_current_user(current_user: dict = Depends(get_current_user)):
    DatabaseService.delete_user(current_user["id"])
    return {"message": "User deleted successfully"}

# Psychologist endpoints
@app.get("/psychologists/me", response_model=Psychologist)
async def get_my_psychologist_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "psychologist":
        raise HTTPException(status_code=403, detail="Not authorized")
    psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
    if not psychologist:
        raise HTTPException(status_code=404, detail="Psychologist profile not found")
    return psychologist

@app.put("/psychologists/me", response_model=Psychologist)
async def update_my_psychologist_profile(psychologist_update: PsychologistBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "psychologist":
        raise HTTPException(status_code=403, detail="Not authorized")
    psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
    if not psychologist:
        raise HTTPException(status_code=404, detail="Psychologist profile not found")
    updated_psychologist = DatabaseService.update_psychologist(psychologist["id"], psychologist_update.dict())
    return updated_psychologist

@app.get("/psychologists/children", response_model=List[Child])
async def get_my_children(current_user: dict = Depends(get_current_user)):
    # 👀 Verificar rol del usuario
    if current_user.get("role") != "psychologist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )

    logger.info(f"Psychologist {current_user.get('email', current_user.get('id'))} requested children list")

    # 🔎 Buscar perfil del psicólogo en la base de datos
    psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
    if not psychologist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Psychologist profile not found"
        )

    # 🧒 Obtener los niños asociados
    children = DatabaseService.get_children_by_psychologist(psychologist["id"])

    normalized_children = []
    for child in children or []:
        normalized_child = dict(child)
        user_payload = normalized_child.pop("user", {}) or {}

        if not normalized_child.get("email"):
            user_email = user_payload.get("email")
            if not user_email:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Child record missing email information"
                )
            normalized_child["email"] = user_email

        if not normalized_child.get("name"):
            normalized_child["name"] = user_payload.get("name") or normalized_child["email"]

        normalized_child["preferences"] = _normalize_preferences_value(
            normalized_child.get("preferences")
        )

    normalized_children.append(normalized_child)

    return normalized_children


@app.get("/psychologists/dashboard", response_model=PsychologistDashboardSummary)
async def get_psychologist_dashboard_summary(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "psychologist":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
    if not psychologist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Psychologist profile not found")
    return DatabaseService.get_psychologist_dashboard(psychologist["id"])


@app.post("/psychologists/me/children", response_model=Child)
async def assign_child_to_psychologist(
    assignment: AssignChild,
    current_user: dict = Depends(get_current_user)
):  
    
    if current_user.get("role") != "psychologist":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
    if not psychologist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Psychologist profile not found")

    # Find the child profile using the user_id from the request
    child_to_assign = DatabaseService.get_child_by_user_id(assignment.child_user_id)
    if not child_to_assign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found for the given user ID")

    # Now we have the child profile's own ID, we can update it.
    updated_child = DatabaseService.assign_psychologist_to_child(child_to_assign["id"], psychologist["id"])
    if not updated_child:
        raise HTTPException(status_code=500, detail="Failed to assign child")

    return updated_child


# Child/Patient endpoints
@app.get("/children/me", response_model=Child)
async def get_my_child_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    return child

@app.put("/children/me", response_model=Child)
async def update_my_child_profile(child_update: ChildBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    updated_child = DatabaseService.update_child(child["id"], child_update.dict())
    return updated_child

@app.delete("/children/me")
async def delete_my_child_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    DatabaseService.delete_child(child["id"])
    return {"message": "Child profile deleted successfully"}

# Biometric data endpoints
@app.post("/biometric-data", response_model=BiometricData)
async def save_biometric_data(biometric_data: BiometricDataCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    data = biometric_data.dict()
    data["child_id"] = child["id"]
    if not data.get("timestamp"):
        data["timestamp"] = datetime.utcnow()
    saved_data = DatabaseService.save_biometric_data(data)
    return saved_data

@app.get("/biometric-data/history", response_model=List[BiometricData])
async def get_biometric_history(
    limit: int = 100,
    child_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] == "child":
        child = DatabaseService.get_child_by_user_id(current_user["id"])
        if not child:
            raise HTTPException(status_code=404, detail="Child profile not found")
        history = DatabaseService.get_biometric_history(child["id"], limit)
        return history

    if current_user["role"] == "psychologist":
        if not child_id:
            raise HTTPException(status_code=400, detail="child_id is required")
        psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
        if not psychologist:
            raise HTTPException(status_code=404, detail="Psychologist profile not found")
        child = DatabaseService.get_child_by_id(child_id)
        if not child or child.get("assigned_psychologist") != psychologist["id"]:
            raise HTTPException(status_code=403, detail="Not authorized for this child")
        history = DatabaseService.get_biometric_history(child_id, limit)
        return history

    raise HTTPException(status_code=403, detail="Not authorized")

# Alert endpoints
@app.post("/alerts", response_model=BiometricAlert)
async def create_alert(alert: BiometricAlertCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    data = alert.dict()
    data["child_id"] = child["id"]
    if not data.get("timestamp"):
        data["timestamp"] = datetime.utcnow()
    saved_alert = DatabaseService.save_alert(data)
    return saved_alert

@app.get("/alerts", response_model=List[BiometricAlert])
async def get_alerts(
    child_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] == "child":
        child = DatabaseService.get_child_by_user_id(current_user["id"])
        if not child:
            raise HTTPException(status_code=404, detail="Child profile not found")
        alerts = DatabaseService.get_alerts(child["id"])
        return alerts

    if current_user["role"] == "psychologist":
        if not child_id:
            raise HTTPException(status_code=400, detail="child_id is required")
        psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
        if not psychologist:
            raise HTTPException(status_code=404, detail="Psychologist profile not found")
        child = DatabaseService.get_child_by_id(child_id)
        if not child or child.get("assigned_psychologist") != psychologist["id"]:
            raise HTTPException(status_code=403, detail="Not authorized for this child")
        alerts = DatabaseService.get_alerts(child_id)
        return alerts

    raise HTTPException(status_code=403, detail="Not authorized")

@app.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    # Allow both child and psychologist to resolve alerts
    if current_user["role"] not in ["child", "psychologist"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    resolved = DatabaseService.resolve_alert(alert_id)
    if not resolved:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert resolved successfully"}

# Emotion record endpoints
@app.post("/emotion-records", response_model=EmotionRecord)
async def save_emotion_record(emotion_record: EmotionRecordCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    data = emotion_record.dict()
    data["child_id"] = child["id"]
    if not data.get("timestamp"):
        data["timestamp"] = datetime.utcnow()
    saved_record = DatabaseService.save_emotion_record(data)
    return saved_record

@app.get("/emotion-records/history", response_model=List[EmotionRecord])
async def get_emotion_history(
    limit: int = 100,
    child_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] == "child":
        child = DatabaseService.get_child_by_user_id(current_user["id"])
        if not child:
            raise HTTPException(status_code=404, detail="Child profile not found")
        history = DatabaseService.get_emotion_history(child["id"], limit)
        return history

    if current_user["role"] == "psychologist":
        if not child_id:
            raise HTTPException(status_code=400, detail="child_id is required")
        psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
        if not psychologist:
            raise HTTPException(status_code=404, detail="Psychologist profile not found")
        child = DatabaseService.get_child_by_id(child_id)
        if not child or child.get("assigned_psychologist") != psychologist["id"]:
            raise HTTPException(status_code=403, detail="Not authorized for this child")
        history = DatabaseService.get_emotion_history(child_id, limit)
        return history

    raise HTTPException(status_code=403, detail="Not authorized")

# Therapy session endpoints
@app.post("/therapy-sessions", response_model=TherapySession)
async def create_therapy_session(session: TherapySessionCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "psychologist":
        raise HTTPException(status_code=403, detail="Not authorized")
    psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
    if not psychologist:
        raise HTTPException(status_code=404, detail="Psychologist profile not found")
    data = session.dict()
    data["psychologist_id"] = psychologist["id"]
    if not data.get("start_time"):
        data["start_time"] = datetime.utcnow()
    saved_session = DatabaseService.create_therapy_session(data)
    return saved_session

@app.put("/therapy-sessions/{session_id}", response_model=TherapySession)
async def update_therapy_session(session_id: str, session_update: TherapySessionBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "psychologist":
        raise HTTPException(status_code=403, detail="Not authorized")
    updated_session = DatabaseService.update_therapy_session(session_id, session_update.dict())
    return updated_session

@app.get("/therapy-sessions", response_model=List[TherapySession])
async def get_therapy_sessions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    sessions = DatabaseService.get_therapy_sessions(child["id"])
    return sessions

@app.get("/therapy-sessions/child/{child_id}", response_model=List[TherapySession])
async def get_child_therapy_sessions(child_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "psychologist":
        raise HTTPException(status_code=403, detail="Not authorized")

    psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
    if not psychologist:
        raise HTTPException(status_code=404, detail="Psychologist profile not found")

    child = DatabaseService.get_child_by_id(child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    if child.get("assigned_psychologist") != psychologist["id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this child")

    sessions = DatabaseService.get_therapy_sessions(child_id)
    return sessions

# Emotional island endpoints
@app.post("/emotional-islands", response_model=EmotionalIsland)
async def create_emotional_island(island: EmotionalIslandCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    data = island.dict()
    data["child_id"] = child["id"]
    saved_island = DatabaseService.create_emotional_island(data)
    return saved_island

@app.put("/emotional-islands/{island_id}", response_model=EmotionalIsland)
async def update_emotional_island(island_id: str, island_update: EmotionalIslandBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    updated_island = DatabaseService.update_emotional_island(island_id, island_update.dict())
    return updated_island

@app.get("/emotional-islands", response_model=List[EmotionalIsland])
async def get_emotional_islands(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    islands = DatabaseService.get_emotional_islands(child["id"])
    return islands

@app.get("/")
def read_root():
    """
    Root endpoint to check if the API is running.
    """
    return {"message": "Welcome to the MindBridge API!"}

@app.websocket("/ws/analyze")
async def websocket_endpoint(websocket: WebSocket):
    global BIOMETRIC_STORAGE_ENABLED
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return

    try:
        current_user = decode_access_token(token)
    except HTTPException as exc:
        await websocket.close(code=1008, reason=exc.detail)
        return
    except Exception as exc:
        print(f"Unexpected error validating token: {exc}")
        await websocket.close(code=1011, reason="Authentication failure")
        return

    child_profile = None
    child_id_param = websocket.query_params.get("child_id")

    if current_user.get("role") == "child":
        child_profile = DatabaseService.get_child_by_user_id(current_user["id"])
        if not child_profile:
            await websocket.close(code=1008, reason="Child profile not found")
            return
        if child_id_param and child_id_param != child_profile["id"]:
            await websocket.close(code=1008, reason="Child mismatch")
            return
    elif current_user.get("role") == "psychologist":
        if not child_id_param:
            await websocket.close(code=1008, reason="child_id is required for psychologists")
            return
        child_profile = DatabaseService.get_child_by_id(child_id_param)
        if not child_profile:
            await websocket.close(code=1008, reason="Child not found")
            return
        psychologist_profile = DatabaseService.get_psychologist_by_user_id(current_user["id"])
        if not psychologist_profile:
            await websocket.close(code=1008, reason="Psychologist profile missing")
            return
        if child_profile.get("assigned_psychologist") != psychologist_profile["id"]:
            await websocket.close(code=1008, reason="Not authorized for this child")
            return
    else:
        await websocket.close(code=1008, reason="Unsupported role for analysis")
        return

    await websocket.accept()
    logger.info("Client connected to WebSocket - Starting real-time microexpression analysis.")
    target_child_id = child_profile["id"] if child_profile else None

    try:
        while True:
            message = await websocket.receive()
            message_type = message.get("type")

            if message_type == "websocket.disconnect":
                logger.info("Client disconnected (code=%s)", message.get("code"))
                break

            text_payload = message.get("text")
            if text_payload:
                text_normalized = text_payload.strip().upper()
                if text_normalized == "STOP":
                    logger.info("Received STOP signal from client.")
                    await websocket.send_json({"type": "status", "message": "Analysis stopped"})
                    break
                logger.debug("Ignoring text payload on WS: %s", text_payload)
                continue

            data = message.get("bytes")
            if not data:
                logger.debug("Received empty payload or unsupported frame type; skipping.")
                continue

            logger.debug(
                "Received frame with %d bytes from client %s",
                len(data),
                current_user.get("id"),
            )

            try:
                img = Image.open(io.BytesIO(data))
                boxes, _ = mtcnn.detect(img)

                if boxes is not None:
                    results = []
                    top_detection = None
                    timestamp = datetime.utcnow()
                    logger.debug("Detected %s face(s) in frame", len(boxes))

                    for i, box in enumerate(boxes):
                        face_img = img.crop(box)
                        face_np = np.array(face_img)

                        emotion, scores = fer.predict_emotions(face_np, logits=False)
                        scores_array = np.array(scores).flatten()
                        scores_list = scores_array.tolist()
                        confidence = float(max(scores_list)) if scores_list else 0.0

                        detection_payload = {
                            "face_id": i,
                            "box": [int(coord) for coord in box],
                            "emotion": emotion,
                            "confidence": confidence,
                            "scores": scores_list,
                        }
                        results.append(detection_payload)

                        if not top_detection or confidence > top_detection["confidence"]:
                            top_detection = detection_payload
                            logger.info(
                                "Top detection updated: face_id=%s emotion=%s confidence=%.2f",
                                detection_payload["face_id"],
                                detection_payload["emotion"],
                                detection_payload["confidence"],
                            )

                    await websocket.send_json({"type": "detections", "detections": results})

                    if target_child_id and top_detection:
                        dominant_emotion = _normalize_emotion(top_detection["emotion"])
                        dominant_confidence = top_detection["confidence"] * 100
                        emotion_buffers[target_child_id].append(
                            {
                                "emotion": dominant_emotion,
                                "confidence": dominant_confidence,
                                "face_count": len(results),
                            }
                        )

                        last_saved = last_emotion_save.get(target_child_id)
                        if not last_saved:
                            last_emotion_save[target_child_id] = timestamp
                        elif (timestamp - last_saved).total_seconds() >= EMOTION_AGGREGATION_INTERVAL:
                            _persist_emotion_snapshot(target_child_id, timestamp)

                        try:
                            DatabaseService.update_child_current_emotion(target_child_id, dominant_emotion)
                        except Exception as exc:
                            logger.error(f"Failed to update child current emotion: {exc}")

                else:
                    logger.debug("No faces detected in current frame")
                    await websocket.send_json({"type": "detections", "detections": []})

            except Exception as processing_error:
                logger.exception("Error during microexpression analysis")
                try:
                    await websocket.send_json({"type": "error", "message": str(processing_error)})
                except Exception:
                    logger.debug("Failed to send error payload back to client")

    except WebSocketDisconnect:
        print("Client disconnected from microexpression analysis.")
    except Exception as e:
        print(f"An error occurred during microexpression analysis: {e}")
    finally:
        if websocket.application_state != WebSocketState.DISCONNECTED:
            await websocket.close(code=1000, reason="Session ended")
        if target_child_id:
            _persist_emotion_snapshot(target_child_id, datetime.utcnow())

# To run this application:
# 1. Make sure you have a virtual environment with the dependencies from requirements.txt installed.
# 2. Run the command: uvicorn main:app --reload
