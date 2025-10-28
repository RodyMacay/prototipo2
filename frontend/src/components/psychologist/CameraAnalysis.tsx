import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, StopCircle, Play, Brain, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useBiometricStore } from '@/store/biometricStore';
import { BiometricData, MicroexpressionFrameData } from '@/types';

interface MicroExpression {
  emotion: string;
  confidence: number;
  timestamp: Date;
}

interface CameraAnalysisProps {
  childId: string | null;
}

export const CameraAnalysis: React.FC<CameraAnalysisProps> = ({ childId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const recordingRef = useRef<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [expressions, setExpressions] = useState<MicroExpression[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { accessToken, user, logout } = useAuthStore();
  const ingestRealtimeFrame = useBiometricStore((state) => state.ingestRealtimeFrame);
  const token = accessToken || localStorage.getItem('access_token');
  const streamRef = useRef<MediaStream | null>(null);

  const normalizeEmotion = (raw: string | null | undefined): string => {
    const map: Record<string, string> = {
      happiness: 'happy',
      happy: 'happy',
      joy: 'happy',
      anger: 'angry',
      angry: 'angry',
      disgust: 'disgust',
      fear: 'fear',
      sadness: 'sad',
      sad: 'sad',
      surprise: 'surprise',
      neutral: 'neutral',
      contempt: 'angry',
      calm: 'neutral',
    };
    const key = (raw ?? '').toLowerCase().trim();
    return map[key] ?? (key || 'neutral');
  };

  const sendFrame = () => {
    const activeSocket = socketRef.current;
    if (!recordingRef.current) {
      return;
    }
    if (!videoRef.current || !canvasRef.current || !activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
      console.warn('sendFrame skipped: resources not ready');
      if (recordingRef.current) {
        animationFrameId.current = requestAnimationFrame(sendFrame);
      }
      return;
    }

    console.info('sendFrame running', { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob && activeSocket && activeSocket.readyState === WebSocket.OPEN) {
          console.info('Frame ready', blob.size);
          activeSocket.send(blob);
        } else {
          console.warn('Blob not sent: socket not ready or blob missing');
        }
      }, 'image/jpeg');
    }
    if (recordingRef.current) {
      animationFrameId.current = requestAnimationFrame(sendFrame);
    }
  };

  const startCamera = async () => {
    const effectiveChildId =
      childId || (user?.role === 'patient' ? user?.id ?? null : null);

    if (!token) {
      setErrorMessage('Sesion no valida. Inicia sesion nuevamente.');
      logout?.();
      return;
    }

    if (user?.role === 'psychologist' && !effectiveChildId) {
      setErrorMessage('Selecciona un paciente antes de iniciar el analisis.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 } // Higher frame rate for real-time microexpression detection
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Start analysis immediately when camera is ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera ready, starting microexpression analysis');
          startAnalysis(token, effectiveChildId);
        };
      }

      setStream(mediaStream);
      streamRef.current = mediaStream;
      setIsRecording(true);
      recordingRef.current = true;
      setErrorMessage(null);

    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('No se pudo acceder a la camara. Verifica los permisos del navegador.');
    }
  };

  const startAnalysis = (wsToken: string, targetChildId: string | null) => {
    // Connect to WebSocket for real-time analysis
    const wsUrl = new URL('ws://127.0.0.1:8000/ws/analyze');
    wsUrl.searchParams.set('token', wsToken);
    if (targetChildId) {
      wsUrl.searchParams.set('child_id', targetChildId);
    }

    const ws = new WebSocket(wsUrl.toString());

    ws.onopen = () => {
      console.log('WebSocket connected - Starting real-time microexpression analysis');
      socketRef.current = ws;
      setSocket(ws);
       recordingRef.current = true;
      // Begin continuous frame analysis
      animationFrameId.current = requestAnimationFrame(sendFrame);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'error') {
        setErrorMessage(data.message || 'Ocurrio un error en el analisis biometrico.');
        return;
      }

      if (data.type !== 'detections' || !data.detections) {
        return;
      }

      if (data.detections.length > 0) {
        const mainDetection = data.detections[0];
        const scoreArray: number[] = Array.isArray(mainDetection.scores)
          ? mainDetection.scores
          : [];
        const primaryConfidence =
          typeof mainDetection.confidence === 'number'
            ? mainDetection.confidence
            : 0;
        const scoreConfidence = scoreArray.length > 0 ? Math.max(...scoreArray) : 0;
        const confidenceRaw = Math.max(primaryConfidence, scoreConfidence, 0);
        const confidencePercent =
          confidenceRaw > 1
            ? Math.min(confidenceRaw, 100)
            : Math.min(confidenceRaw * 100, 100);

        const normalizedEmotion = normalizeEmotion(mainDetection.emotion);

        const expressionConfidence =
          confidenceRaw > 1 ? confidenceRaw / 100 : confidenceRaw;

        const newExpression: MicroExpression = {
          emotion: normalizedEmotion,
          confidence: expressionConfidence,
          timestamp: new Date(),
        };
        setCurrentEmotion(normalizedEmotion);
        setExpressions((prev) => [...prev.slice(-9), newExpression]);

        const detections = data.detections.map((det: any, index: number) => {
          const detScores: number[] = Array.isArray(det.scores) ? det.scores : [];
          const detConfidence =
            typeof det.confidence === 'number'
              ? det.confidence
              : detScores.length > 0
              ? Math.max(...detScores)
              : 0;

          return {
            face_id: det.face_id ?? index,
            box: det.box ?? [],
            emotion: normalizeEmotion(det.emotion),
            confidence: detConfidence,
            scores: detScores,
          };
        });

        const frameData: MicroexpressionFrameData = {
          detections,
          face_count: data.detections.length,
          dominant_emotion: normalizedEmotion,
          dominant_confidence: confidencePercent,
        };

        const snapshot: BiometricData = {
          timestamp: new Date(),
          faceCount: data.detections.length,
          dominantEmotion: normalizedEmotion,
          dominantConfidence: confidencePercent,
          microexpression_data: frameData,
        };

        ingestRealtimeFrame(snapshot);
      } else {
        setCurrentEmotion('neutral');
        const snapshot: BiometricData = {
          timestamp: new Date(),
          faceCount: 0,
          dominantEmotion: 'neutral',
          dominantConfidence: 0,
          microexpression_data: {
            detections: [],
            face_count: 0,
            dominant_emotion: 'neutral',
            dominant_confidence: 0,
          },
        };
        ingestRealtimeFrame(snapshot);
      }
    };

    ws.onclose = (event) => {
      socketRef.current = null;
      console.log('WebSocket disconnected', event);
      setSocket(null);
      setIsRecording(false);
      recordingRef.current = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setStream(null);

      if (event.code === 1008 && event.reason) {
        if (event.reason.toLowerCase().includes('expired')) {
          setErrorMessage('Tu sesion expiro. Vuelve a iniciar sesion e intenta nuevamente.');
          logout?.();
        } else {
          setErrorMessage(`Conexion cerrada: ${event.reason}`);
        }
      } else {
        setErrorMessage(prev => prev ?? 'Conexion cerrada.');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      socketRef.current = null;
      setSocket(null);
      setIsRecording(false);
      recordingRef.current = false;
      setErrorMessage(prev => prev ?? 'Ocurrio un error en la conexion con el analisis biometrico.');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setStream(null);
    };
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send('STOP');
        socketRef.current.close(1000, 'client_stop');
      } else {
        socketRef.current.close();
      }
    }
    setSocket(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
    setCurrentEmotion('neutral');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      joy: 'text-yellow-600 bg-yellow-100',
      sadness: 'text-blue-600 bg-blue-100',
      anger: 'text-red-600 bg-red-100',
      surprise: 'text-purple-600 bg-purple-100',
      fear: 'text-orange-600 bg-orange-100',
      disgust: 'text-green-600 bg-green-100',
      neutral: 'text-gray-600 bg-gray-100'
    };
    return colors[emotion] || colors.neutral;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Camera Feed */}
      <Card className="psych-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-500" />
            Análisis de Micro-expresiones
          </CardTitle>
          <CardDescription>
            Análisis en tiempo real del comportamiento emocional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden" // Canvas is used for processing, not display
              />
            </div>
            
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">REC</span>
              </div>
            )}
            
            {isRecording && currentEmotion !== 'neutral' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bottom-4 left-4"
              >
                <Badge className={`${getEmotionColor(currentEmotion)} font-medium`}>
                  {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
                </Badge>
              </motion.div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={isRecording ? stopCamera : startCamera}
                disabled={
                  isRecording
                    ? false
                    : !token || (user?.role === 'psychologist' && !childId)
                }
                className={`$
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isRecording ? (
                  <>
                    <StopCircle className="w-4 h-4 mr-2" />
                    Detener Analisis
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Analisis
                  </>
                )}
              </Button>

              {isRecording && (
                <div className="flex items-center text-sm text-green-600">
                  <Brain className="w-4 h-4 mr-2" />
                  Analisis de microexpresiones activo
                </div>
              )}

              {!isRecording && (
                <div className="flex items-center text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Permite el acceso a la camara para comenzar
                </div>
              )}
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expression Analysis */}
      <Card className="psych-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Análisis de Comportamiento
          </CardTitle>
          <CardDescription>
            Progreso emocional detectado en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expressions.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Emoción Predominante</p>
                    <p className="text-2xl font-bold capitalize">{currentEmotion}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Sesiones Analizadas</p>
                    <p className="text-2xl font-bold">{expressions.length}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Historial Reciente</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {expressions.slice(-5).reverse().map((expr, index) => (
                      <motion.div
                        key={`${expr.timestamp.getTime()}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <Badge className={`${getEmotionColor(expr.emotion)} text-xs`}>
                            {expr.emotion}
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">
                            {expr.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {Math.round(expr.confidence * 100)}%
                          </p>
                          <p className="text-xs text-gray-600">confianza</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Inicia el análisis para ver el progreso</p>
                <p className="text-sm">Las micro-expresiones se detectarán automáticamente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};














