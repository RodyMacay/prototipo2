from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import cv2
import numpy as np
from PIL import Image
import io
import torch
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

# Emotion Recognition
from hsemotion.facial_emotions import HSEmotionRecognizer

# Face Detection
from facenet_pytorch import MTCNN

# Local imports
from models import *
from auth_fixed import authenticate_user, create_access_token, get_current_user, get_password_hash
from database import DatabaseService

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

print("Models initialized!")

# Authentication endpoints
@app.post("/auth/register", response_model=RegisterResponse)
async def register(user: UserRegister):
    # Check if user already exists
    existing_user = DatabaseService.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = get_password_hash(user.password)

    # Create user
    user_data = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": user.role
    }
    created_user = DatabaseService.create_user(user_data)

    # If psychologist, create psychologist profile
    if user.role == "psychologist":
        psychologist_data = {
            "user_id": created_user["id"],
            "license_number": user.license_number if hasattr(user, 'license_number') else "TEMP-" + str(created_user["id"])[:8],
            "date_of_birth": user.date_of_birth if hasattr(user, 'date_of_birth') else None,
            "sex": user.sex if hasattr(user, 'sex') else None,
            "phone_number": user.phone_number if hasattr(user, 'phone_number') else None,
            "address": user.address if hasattr(user, 'address') else None,
            "specializations": user.specializations if hasattr(user, 'specializations') else [],
            "hospital": user.hospital if hasattr(user, 'hospital') else None,
            "years_experience": user.years_experience if hasattr(user, 'years_experience') else 0
        }
        DatabaseService.create_psychologist(psychologist_data)

    # If child, create child profile
    elif user.role == "child":
        child_data = {
            "user_id": created_user["id"],
            "age": user.age if hasattr(user, 'age') else 0,
            "sex": user.sex if hasattr(user, 'sex') else None,
            "date_of_birth": user.date_of_birth if hasattr(user, 'date_of_birth') else None,
            "address": user.address if hasattr(user, 'address') else None,
            "guardian_name": user.guardian_name if hasattr(user, 'guardian_name') else None,
            "guardian_phone": user.guardian_phone if hasattr(user, 'guardian_phone') else None,
            "asd_level": user.asd_level if hasattr(user, 'asd_level') else None,
            "guardian_email": user.guardian_email if hasattr(user, 'guardian_email') else None,
            "diagnosis": user.diagnosis if hasattr(user, 'diagnosis') else [],
            "clinical_history_file": user.clinical_history_file if hasattr(user, 'clinical_history_file') else None
        }
        DatabaseService.create_child(child_data)

    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": created_user['email']}, expires_delta=access_token_expires
    )

    # Fetch the full user object to return
    full_user = DatabaseService.get_user_by_id(created_user["id"])

    return {
        "token": {"access_token": access_token, "token_type": "bearer"},
        "user": full_user
    }


@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

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
    if current_user["role"] != "psychologist":
        raise HTTPException(status_code=403, detail="Not authorized")
    psychologist = DatabaseService.get_psychologist_by_user_id(current_user["id"])
    if not psychologist:
        raise HTTPException(status_code=404, detail="Psychologist profile not found")
    children = DatabaseService.get_children_by_psychologist(psychologist["id"])
    return children


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
async def get_biometric_history(limit: int = 100, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    history = DatabaseService.get_biometric_history(child["id"], limit)
    return history

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
async def get_alerts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    alerts = DatabaseService.get_alerts(child["id"])
    return alerts

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
async def get_emotion_history(limit: int = 100, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "child":
        raise HTTPException(status_code=403, detail="Not authorized")
    child = DatabaseService.get_child_by_user_id(current_user["id"])
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")
    history = DatabaseService.get_emotion_history(child["id"], limit)
    return history

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
async def websocket_endpoint(websocket: WebSocket, current_user: dict = Depends(get_current_user)):
    await websocket.accept()
    print("Client connected to WebSocket - Starting real-time microexpression analysis.")
    try:
        while True:
            # Receive image data from the client (continuous video stream)
            data = await websocket.receive_bytes()

            # Convert to PIL Image
            img = Image.open(io.BytesIO(data))

            # --- 1. Face Detection ---
            boxes, _ = mtcnn.detect(img)

            if boxes is not None:
                results = []
                for i, box in enumerate(boxes):
                    face_img = img.crop(box)
                    face_np = np.array(face_img)

                    # --- 2. Microexpression Recognition ---
                    emotion, scores = fer.predict_emotions(face_np, logits=False)

                    results.append({
                        "face_id": i,
                        "box": [int(coord) for coord in box],
                        "emotion": emotion,
                        "scores": scores.tolist()
                    })

                    # Save emotion record to database if user is a child
                    if current_user["role"] == "child":
                        child = DatabaseService.get_child_by_user_id(current_user["id"])
                        if child:
                            emotion_data = {
                                "child_id": child["id"],
                                "emotion": emotion,
                                "intensity": max(scores) * 100,  # Convert to percentage
                                "timestamp": datetime.utcnow()
                            }
                            DatabaseService.save_emotion_record(emotion_data)

                # Send results back to the client for real-time display
                await websocket.send_json({"detections": results})
            else:
                # If no face is detected, send an empty list
                await websocket.send_json({"detections": []})

    except WebSocketDisconnect:
        print("Client disconnected from microexpression analysis.")
    except Exception as e:
        print(f"An error occurred during microexpression analysis: {e}")
        await websocket.close(code=1011)

# To run this application:
# 1. Make sure you have a virtual environment with the dependencies from requirements.txt installed.
# 2. Run the command: uvicorn main:app --reload
