from supabase import create_client, Client
import os
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "your-supabase-url")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-anon-key")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Failed to create Supabase client: {e}")
    supabase = None

class DatabaseService:
    @staticmethod
    def get_user_by_email(email: str) -> Dict[str, Any]:
        response = supabase.table('users').select('*').eq('email', email).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_user_by_id(user_id: str) -> Dict[str, Any]:
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        return response.data[0] if response.data else None

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
        response = supabase.table('psychologists').insert(psychologist_data).execute()
        return response.data[0]

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
    def create_child(child_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('children').insert(child_data).execute()
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
    def save_biometric_data(biometric_data: Dict[str, Any]) -> Dict[str, Any]:
        response = supabase.table('biometric_data').insert(biometric_data).execute()
        return response.data[0]

    @staticmethod
    def get_biometric_history(child_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        response = supabase.table('biometric_data').select('*').eq('child_id', child_id).order('timestamp', desc=True).limit(limit).execute()
        return response.data

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
