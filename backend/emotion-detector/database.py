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
    def get_psychologist_dashboard(psychologist_id: str) -> Dict[str, Any]:
        if supabase is None:
            raise RuntimeError("Supabase client not configured")

        now = datetime.utcnow()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999).isoformat()

        children_response = (
            supabase
            .table('children')
            .select('id,name,guardian_name,user:users(name)')
            .eq('assigned_psychologist', psychologist_id)
            .execute()
        )
        child_rows = children_response.data or []
        child_lookup: Dict[str, Dict[str, Any]] = {}
        for row in child_rows:
            child_id = row.get('id')
            if not child_id:
                continue
            user_payload = row.get('user') or {}
            child_lookup[child_id] = {
                "name": row.get('name') or user_payload.get('name'),
                "guardian_name": row.get('guardian_name'),
            }
        child_ids = list(child_lookup.keys())

        sessions_today_response = (
            supabase
            .table('therapy_sessions')
            .select('id, child_id, start_time, status')
            .eq('psychologist_id', psychologist_id)
            .gte('start_time', start_of_day)
            .lte('start_time', end_of_day)
            .execute()
        )
        sessions_today_rows = sessions_today_response.data or []
        sessions_today = len(sessions_today_rows)

        upcoming_sessions_response = (
            supabase
            .table('therapy_sessions')
            .select('id, child_id, start_time, status')
            .eq('psychologist_id', psychologist_id)
            .gte('start_time', now.isoformat())
            .order('start_time', desc=False)
            .limit(5)
            .execute()
        )
        upcoming_rows = upcoming_sessions_response.data or []
        upcoming_sessions = [
            {
                "id": row.get('id'),
                "child_id": row.get('child_id'),
                "child_name": child_lookup.get(row.get('child_id', ''), {}).get('name'),
                "start_time": row.get('start_time'),
                "status": row.get('status'),
            }
            for row in upcoming_rows
            if row.get('id') and row.get('child_id')
        ]

        alerts_rows: List[Dict[str, Any]] = []
        unresolved_alerts = 0
        if child_ids:
            alerts_response = (
                supabase
                .table('biometric_alerts')
                .select('id, child_id, type, severity, message, timestamp, resolved')
                .in_('child_id', child_ids)
                .order('timestamp', desc=True)
                .limit(10)
                .execute()
            )
            alerts_rows = alerts_response.data or []
            unresolved_alerts = sum(1 for alert in alerts_rows if not alert.get('resolved'))

        alerts = [
            {
                "id": row.get('id'),
                "child_id": row.get('child_id'),
                "child_name": child_lookup.get(row.get('child_id', ''), {}).get('name'),
                "type": row.get('type'),
                "severity": row.get('severity'),
                "message": row.get('message'),
                "timestamp": row.get('timestamp'),
                "resolved": row.get('resolved', False),
            }
            for row in alerts_rows
            if row.get('id') and row.get('child_id')
        ]

        recent_biometrics: List[Dict[str, Any]] = []
        latest_by_child: Dict[str, Dict[str, Any]] = {}
        if child_ids:
            biometrics_response = (
                supabase
                .table('biometric_data')
                .select('child_id, heart_rate, stress_level, face_count, dominant_emotion, dominant_confidence, timestamp')
                .in_('child_id', child_ids)
                .order('timestamp', desc=True)
                .limit(max(len(child_ids) * 5, 10))
                .execute()
            )
            biometric_rows = biometrics_response.data or []
            for row in biometric_rows:
                child_id = row.get('child_id')
                if not child_id:
                    continue
                if child_id not in latest_by_child:
                    latest_by_child[child_id] = row
            recent_biometrics = [
                {
                    "child_id": row.get('child_id'),
                    "child_name": child_lookup.get(row.get('child_id', ''), {}).get('name'),
                    "timestamp": row.get('timestamp'),
                    "heart_rate": row.get('heart_rate'),
                    "stress_level": row.get('stress_level'),
                    "face_count": row.get('face_count'),
                    "dominant_emotion": row.get('dominant_emotion'),
                    "dominant_confidence": row.get('dominant_confidence'),
                }
                for row in biometric_rows[: min(len(biometric_rows), 6)]
                if row.get('child_id')
            ]
        heart_rates = [
            row.get('heart_rate')
            for row in latest_by_child.values()
            if isinstance(row.get('heart_rate'), (int, float))
        ]
        average_heart_rate = round(sum(heart_rates) / len(heart_rates), 2) if heart_rates else None

        stress_distribution: Dict[str, int] = {"low": 0, "medium": 0, "high": 0}
        for row in latest_by_child.values():
            level = row.get('stress_level')
            if isinstance(level, str):
                normalized = level.lower()
                if normalized in stress_distribution:
                    stress_distribution[normalized] += 1

        emotion_counts: Dict[str, int] = {}
        if child_ids:
            emotion_response = (
                supabase
                .table('emotion_records')
                .select('emotion')
                .in_('child_id', child_ids)
                .order('timestamp', desc=True)
                .limit(200)
                .execute()
            )
            for row in emotion_response.data or []:
                emotion = row.get('emotion')
                if not emotion:
                    continue
                key = str(emotion).lower()
                emotion_counts[key] = emotion_counts.get(key, 0) + 1

        emotion_distribution = [
            {"emotion": emotion, "count": count}
            for emotion, count in sorted(emotion_counts.items(), key=lambda item: item[1], reverse=True)
        ]

        return {
            "total_patients": len(child_ids),
            "sessions_today": sessions_today,
            "unresolved_alerts": unresolved_alerts,
            "average_heart_rate": average_heart_rate,
            "stress_distribution": stress_distribution,
            "emotion_distribution": emotion_distribution,
            "recent_biometrics": recent_biometrics,
            "upcoming_sessions": upcoming_sessions,
            "alerts": alerts,
        }

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
        payload: Dict[str, Any] = {
            "child_id": biometric_data.get("child_id"),
            "heart_rate": biometric_data.get("heart_rate"),
            "stress_level": biometric_data.get("stress_level"),
            "skin_temperature": biometric_data.get("skin_temperature"),
            "activity": biometric_data.get("activity"),
            "face_count": biometric_data.get("face_count"),
            "dominant_emotion": biometric_data.get("dominant_emotion"),
            "dominant_confidence": biometric_data.get("dominant_confidence"),
            "microexpression_data": biometric_data.get("microexpression_data") or {},
        }

        timestamp_value = biometric_data.get("timestamp")
        if isinstance(timestamp_value, datetime):
            payload["timestamp"] = timestamp_value.isoformat()
        elif isinstance(timestamp_value, str):
            payload["timestamp"] = timestamp_value

        # Supabase expects JSON-serialisable values
        if not isinstance(payload["microexpression_data"], dict):
            payload["microexpression_data"] = {}

        response = supabase.table('biometric_data').insert(payload).execute()
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
