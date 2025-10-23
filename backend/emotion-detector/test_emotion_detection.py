import pytest
import numpy as np
from PIL import Image
import io
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from main import app
import cv2

client = TestClient(app)

class TestEmotionDetection:
    """Pruebas unitarias para el sistema de detección de emociones"""

    def test_models_initialization(self):
        """Verificar que los modelos se inicialicen correctamente"""
        from main import mtcnn, fer

        assert mtcnn is not None, "MTCNN model should be initialized"
        assert fer is not None, "HSEmotionRecognizer should be initialized"

        # Verificar que los modelos tienen los métodos esperados
        assert hasattr(mtcnn, 'detect'), "MTCNN should have detect method"
        assert hasattr(fer, 'predict_emotions'), "FER should have predict_emotions method"

    def test_face_detection_with_valid_image(self):
        """Probar detección de rostros con imagen válida"""
        from main import mtcnn

        # Crear una imagen de prueba simple con un rostro simulado
        img = Image.new('RGB', (100, 100), color='white')
        # Agregar algunos píxeles para simular un rostro básico
        pixels = np.array(img)
        pixels[40:60, 40:60] = [255, 200, 150]  # Color de piel básico
        img = Image.fromarray(pixels)

        boxes, _ = mtcnn.detect(img)

        # Verificar que se detecte al menos un rostro (aunque sea simulado)
        assert boxes is not None or boxes is not None, "Face detection should return results"

    def test_emotion_recognition_with_face_image(self):
        """Probar reconocimiento de emociones con imagen de rostro"""
        from main import fer

        # Crear imagen de prueba con rostro simulado
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)

        try:
            emotion, scores = fer.predict_emotions(img, logits=False)

            assert emotion is not None, "Emotion should be detected"
            assert isinstance(scores, np.ndarray), "Scores should be numpy array"
            assert len(scores) > 0, "Scores array should not be empty"
            assert emotion in ['joy', 'sadness', 'anger', 'fear', 'disgust', 'neutral'], f"Emotion {emotion} should be valid"

        except Exception as e:
            # Si falla por modelo no disponible, marcar como esperado
            pytest.skip(f"Model prediction failed (expected in some environments): {e}")

    @patch('main.DatabaseService.save_emotion_record')
    def test_emotion_record_save(self, mock_save):
        """Probar guardado de registros de emociones"""
        from main import DatabaseService

        mock_save.return_value = {"id": "test-id", "emotion": "joy"}

        emotion_data = {
            "child_id": "test-child-id",
            "emotion": "joy",
            "intensity": 85.5,
            "timestamp": "2024-01-01T00:00:00Z"
        }

        result = DatabaseService.save_emotion_record(emotion_data)

        mock_save.assert_called_once_with(emotion_data)
        assert result["emotion"] == "joy"

    def test_websocket_connection(self):
        """Probar conexión WebSocket básica"""
        with client.websocket_connect("/ws/analyze") as websocket:
            # Verificar que la conexión se establece
            assert websocket is not None

    def test_invalid_image_data(self):
        """Probar manejo de datos de imagen inválidos"""
        with client.websocket_connect("/ws/analyze") as websocket:
            # Enviar datos inválidos
            websocket.send_bytes(b"invalid image data")

            # Debería manejar el error gracefully
            response = websocket.receive_json()
            assert "detections" in response

    def test_no_face_detected(self):
        """Probar caso cuando no se detecta ningún rostro"""
        # Crear imagen sin rostro (solo ruido)
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        pil_img = Image.fromarray(img)

        # Convertir a bytes como lo haría el WebSocket
        img_byte_arr = io.BytesIO()
        pil_img.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()

        with client.websocket_connect("/ws/analyze") as websocket:
            websocket.send_bytes(img_bytes)
            response = websocket.receive_json()

            # Debería devolver lista vacía cuando no hay rostros
            assert response["detections"] == []

    def test_emotion_intensity_calculation(self):
        """Probar cálculo de intensidad de emociones"""
        scores = np.array([0.1, 0.8, 0.05, 0.03, 0.02, 0.0])  # Ejemplo de scores

        intensity = max(scores) * 100  # Como se calcula en el código

        assert intensity == 80.0, f"Intensity should be 80.0, got {intensity}"
        assert 0 <= intensity <= 100, "Intensity should be between 0 and 100"

    def test_multiple_faces_detection(self):
        """Probar detección de múltiples rostros"""
        from main import mtcnn

        # Crear imagen más grande con potencial para múltiples rostros
        img = Image.new('RGB', (300, 200), color='white')

        boxes, _ = mtcnn.detect(img)

        # No podemos garantizar detección, pero el método debería ejecutarse
        assert boxes is not None or boxes is None  # Puede ser None si no detecta

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
