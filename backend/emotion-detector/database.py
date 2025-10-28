from datetime import date, datetime
from supabase import create_client, Client
import os
from typing import List, Dict, Any, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://adzuddupoarpfjlfkhac.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkenVkZHVwb2FycGZqbGZraGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDgxMTIsImV4cCI6MjA3MzgyNDExMn0.RWMYnkr6NnOEVs-C_u2uEgDuz5e1Io8laT9isBRHqG4")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Failed to create Supabase client: {e}")
    supabase = None

class DatabaseService:
    @staticmethod
    def create_supabase_auth_user(email: str, password: str, user_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("Supabase service role key not configured")
        payload: Dict[str, Any] = {
            "email": email,
            "password": password,
            "email_confirm": True,
        }
        if user_metadata:
            payload["user_metadata"] = user_metadata
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
        if response.status_code >= 400:
            raise RuntimeError(response.text)
        return response.json()

    @staticmethod
    def confirm_supabase_user(email: str) -> Dict[str, Any]:
        if not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("Supabase service role key not configured")

        list_response = requests.get(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            params={"email": email},
            headers={
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            },
            timeout=10,
        )
        if list_response.status_code >= 400:
            raise RuntimeError(list_response.text)
        payload = list_response.json()
        users = payload.get("users") or []
        if not users:
            raise RuntimeError("User not found in Supabase auth")

        user_id = users[0].get("id")
        if not user_id:
            raise RuntimeError("Supabase user payload missing id")

        update_response = requests.put(
            f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
            headers={
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
            json={"email_confirm": True},
            timeout=10,
        )
        if update_response.status_code >= 400:
            raise RuntimeError(update_response.text)
        return update_response.json()

    @staticmethod
    def get_user_by_email(email: str) -> Dict[str, Any]:
        response = supabase.table('users').select('*').eq('email', email).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_user_by_id(user_id: str) -> Dict[str, Any]:
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def ensure_user_record(user_id: str, email: str, name: Optional[str] = None, role: Optional[str] = None) -> Optional[Dict[str, Any]]:
        existing = DatabaseService.get_user_by_id(user_id)
        if existing:
            return existing
        payload = {
            "id": user_id,
            "email": email,
            "name": name or email.split("@")[0],
            "role": role or "psychologist",
        }
        response = supabase.table('users').upsert(payload, on_conflict='id').execute()
        if response.data:
            return response.data[0]
        return DatabaseService.get_user_by_id(user_id)

    @staticmethod
    def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('users').insert(user_data).execute()
        return response.data[0]

    @staticmethod
    def update_user(user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('users').update(user_data).eq('id', user_id).execute()
        return response.data[0]

    @staticmethod
    def delete_user(user_id: str) -> bool:
        response = supabase.table('users').delete().eq('id', user_id).execute()
        return len(response.data) > 0

    @staticmethod
    def get_psychologist_by_user_id(user_id: str) -> Dict[str, Any]:
        response = supabase.table('psychologists').select('*').eq('user_id', user_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def create_psychologist(psychologist_data: Dict[str, Any]) -> Dict[str, Any]:
        response = (
            supabase.table('psychologists')
            .upsert(psychologist_data, on_conflict='user_id')
            .execute()
        )
        if response.data:
            return response.data[0]
        # Fetch to ensure we return the persisted record
        lookup = (
            supabase.table('psychologists')
            .select('*')
            .eq('user_id', psychologist_data.get('user_id'))
            .execute()
        )
        return lookup.data[0] if lookup.data else {}

    @staticmethod
    def update_psychologist(psychologist_id: str, psychologist_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('psychologists').update(psychologist_data).eq('id', psychologist_id).execute()
        return response.data[0]

    @staticmethod
    def get_children_by_psychologist(psychologist_id: str) -> List[Dict[str, Any]]:
        response = supabase.table('children').select('*, user:users(*)').eq('assigned_psychologist', psychologist_id).execute()
        return response.data

    @staticmethod
    def get_child_by_user_id(user_id: str) -> Dict[str, Any]:
        response = supabase.table('children').select('*').eq('user_id', user_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_child_by_id(child_id: str) -> Dict[str, Any]:
        response = supabase.table('children').select('*').eq('id', child_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def create_child(child_data):
        # Convertir fechas a string ISO si existen
        for key, value in child_data.items():
            if isinstance(value, (datetime, date)):
                child_data[key] = value.isoformat()

        response = supabase.table("children").insert(child_data).execute()
        return response.data[0]

    @staticmethod
    def update_child(child_id: str, child_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('children').update(child_data).eq('id', child_id).execute()
        return response.data[0]

    @staticmethod
    def delete_child(child_id: str) -> bool:
        response = supabase.table('children').delete().eq('id', child_id).execute()
        return len(response.data) > 0

    @staticmethod
    def assign_psychologist_to_child(child_id: str, psychologist_id: str) -> Dict[str, Any]:
        response = supabase.table('children').update({'assigned_psychologist': psychologist_id}).eq('id', child_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def update_child_current_emotion(child_id: str, emotion: str) -> Optional[Dict[str, Any]]:
        response = supabase.table('children').update({'current_emotion': emotion}).eq('id', child_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def save_biometric_data(biometric_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('biometric_data').insert(biometric_data).execute()
        return response.data[0]

    @staticmethod
    def get_biometric_history(child_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        response = (
            supabase.table('biometric_data')
            .select('*')
            .eq('child_id', child_id)
            .order('timestamp', desc=True)
            .limit(limit)
            .execute()
        )
        records = response.data or []
        for record in records:
            micro_data = record.get('microexpression_data')
            if not isinstance(micro_data, dict):
                record['microexpression_data'] = {}
        return records

    @staticmethod
    def save_alert(alert_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('biometric_alerts').insert(alert_data).execute()
        return response.data[0]

    @staticmethod
    def get_alerts(child_id: str) -> List[Dict[str, Any]]:
        response = supabase.table('biometric_alerts').select('*').eq('child_id', child_id).order('timestamp', desc=True).execute()
        return response.data

    @staticmethod
    def resolve_alert(alert_id: str) -> bool:
        response = supabase.table('biometric_alerts').update({'resolved': True}).eq('id', alert_id).execute()
        return len(response.data) > 0

    @staticmethod
    def save_emotion_record(emotion_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('emotion_records').insert(emotion_data).execute()
        return response.data[0]

    @staticmethod
    def get_emotion_history(child_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        response = supabase.table('emotion_records').select('*').eq('child_id', child_id).order('timestamp', desc=True).limit(limit).execute()
        return response.data

    @staticmethod
    def create_therapy_session(session_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('therapy_sessions').insert(session_data).execute()
        return response.data[0]

    @staticmethod
    def update_therapy_session(session_id: str, session_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('therapy_sessions').update(session_data).eq('id', session_id).execute()
        return response.data[0]

    @staticmethod
    def get_therapy_sessions(child_id: str) -> List[Dict[str, Any]]:
        response = supabase.table('therapy_sessions').select('*').eq('child_id', child_id).order('start_time', desc=True).execute()
        return response.data

    @staticmethod
    def create_emotional_island(island_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('emotional_islands').insert(island_data).execute()
        return response.data[0]

    @staticmethod
    def update_emotional_island(island_id: str, island_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('emotional_islands').update(island_data).eq('id', island_id).execute()
        return response.data[0]

    @staticmethod
    def get_emotional_islands(child_id: str) -> List[Dict[str, Any]]:
        response = supabase.table('emotional_islands').select('*').eq('child_id', child_id).execute()
        return response.data
