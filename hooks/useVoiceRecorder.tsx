// hooks/useVoiceRecorder.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { Scribe, CommitStrategy, RealtimeEvents, type RealtimeConnection, AudioFormat } from "@elevenlabs/client";

interface VoiceRecorderState {
  isConnected: boolean;
  isRecording: boolean;
  partialTranscript: string;
  committedTranscripts: Array<{ id: string; text: string; timestamp: Date }>;
  error: string | null;
}

interface UseVoiceRecorderOptions {
  token: string | null;
  languageCode?: string;
  modelId?: string;
  autoConnect?: boolean;
}

interface PartialTranscriptData {
  text?: string;
}

interface CommittedTranscriptData {
  text?: string;
}

interface ErrorData {
  message?: string;
}

interface AuthErrorData {
  error?: string;
}

export function useVoiceRecorder({ 
  token, 
  languageCode = "es", 
  modelId = "scribe_v2_realtime",
  autoConnect = false 
}: UseVoiceRecorderOptions) {
  const [state, setState] = useState<VoiceRecorderState>({
    isConnected: false,
    isRecording: false,
    partialTranscript: '',
    committedTranscripts: [],
    error: null,
  });

  const connectionRef = useRef<RealtimeConnection | null>(null);
  const recordingStateRef = useRef<boolean>(false);
  const transcriptIdCounter = useRef<number>(0);

  const connect = useCallback(async () => {
    if (connectionRef.current || !token) {
      if (!token) {
        setState(prev => ({ ...prev, error: 'Token no proporcionado' }));
      } else {
        console.log('⏭️ Ya hay una conexión activa');
      }
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      // Verificar permisos del micrófono primero
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (micError) {
        setState(prev => ({
          ...prev,
          error: 'Permisos del micrófono denegados. Por favor, permite el acceso al micrófono.'
        }));
        throw new Error('Microphone permission denied');
      }
      const connectionPromise = new Promise<RealtimeConnection>((resolve, reject) => {
        const connection = Scribe.connect({
          token,
          modelId,
          languageCode,
          includeTimestamps: false,
          commitStrategy: CommitStrategy.VAD, // VAD automático para conversación natural
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
          vadSilenceThresholdSecs: 0.8, // 800ms de silencio para considerar fin de frase
          vadThreshold: 0.5, // Umbral de sensibilidad para detectar voz

        });

        const timeout = setTimeout(() => {
          reject(new Error('Timeout esperando conexión'));
        }, 10000);

        connection.on(RealtimeEvents.SESSION_STARTED, () => {
          clearTimeout(timeout);
          setState(prev => ({ ...prev, isConnected: true, error: null }));
          resolve(connection);
        });

        // Manejar errores de conexión
        connection.on(RealtimeEvents.AUTH_ERROR, (...args: unknown[]) => {
          clearTimeout(timeout);
          const error = args[0] as AuthErrorData;
          reject(new Error(`Error de autenticación: ${error.error || 'Token inválido'}`));
        });

        connection.on(RealtimeEvents.CLOSE, (...args: unknown[]) => {
          clearTimeout(timeout);
          const closeEvent = args[0] as { code?: number; reason?: string };
          if (closeEvent?.code === 1006) {
            reject(new Error('Conexión cerrada inesperadamente'));
          }
        });
      });

      const connection = await connectionPromise;
      connectionRef.current = connection;

      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (...args: unknown[]) => {
        const data = args[0] as PartialTranscriptData;
        if (recordingStateRef.current && data.text) {
          console.log('[DEBUG] Transcripción parcial:', data.text);
          setState(prev => ({
            ...prev,
            partialTranscript: data.text || ''
          }));
        }
      });

      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (...args: unknown[]) => {

        const data = args[0] as CommittedTranscriptData;
        console.log('[DEBUG] Transcripción confirmada (VAD):', data.text);
        if (!recordingStateRef.current) {
          return;
        }
        if (!data.text || data.text.trim() === '') {
          return;
        }

        const newTranscript = {
          id: `transcript-${transcriptIdCounter.current++}`,
          text: data.text || '',
          timestamp: new Date(),
        };

        setState(prev => ({
          ...prev,
          committedTranscripts: [...prev.committedTranscripts, newTranscript],
          partialTranscript: '',
        }));
      });

      connection.on(RealtimeEvents.ERROR, (...args: unknown[]) => {
        const error = args[0] as ErrorData;
        setState(prev => ({
          ...prev,
          error: error.message || 'Error desconocido',
          isRecording: false
        }));
        recordingStateRef.current = false;
      });

      connection.on(RealtimeEvents.AUTH_ERROR, (...args: unknown[]) => {
        const error = args[0] as AuthErrorData;
        setState(prev => ({
          ...prev,
          error: `Error de autenticación: ${error.error || 'Token inválido'}`,
          isRecording: false
        }));
        recordingStateRef.current = false;
      });

      connection.on(RealtimeEvents.CLOSE, (...args: unknown[]) => {
        const closeEvent = args[0] as { code?: number; reason?: string };

        recordingStateRef.current = false;

        if (closeEvent?.code === 1006) {
          setState(prev => ({
            ...prev,
            isConnected: false,
            isRecording: false,
            error: 'Conexión cerrada inesperadamente. Verifica token y permisos.'
          }));
        } else {
          setState(prev => ({
            ...prev,
            isConnected: false,
            isRecording: false
          }));
        }
      });

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      }));
      throw error;
    }
  }, [token, languageCode, modelId]);

  useEffect(() => {
    if (autoConnect && token && !connectionRef.current) {
      connect();
    }
  }, [token, autoConnect, connect]);

  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        recordingStateRef.current = false;
        connectionRef.current.close();
        connectionRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!state.isConnected || state.isRecording) {
      return;
    }

    recordingStateRef.current = true;
    setState(prev => ({
      ...prev,
      isRecording: true,
      partialTranscript: '',
      error: null
    }));
  }, [state.isConnected, state.isRecording]);

  // Desactivar modo escucha (pausar VAD)
  const stopRecording = useCallback(() => {
    if (!state.isRecording) {
      return;
    }

    recordingStateRef.current = false;
    setState(prev => ({ ...prev, isRecording: false, partialTranscript: '' }));
  }, [state.isRecording]);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      recordingStateRef.current = false;
      connectionRef.current.close();
      connectionRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isRecording: false,
      partialTranscript: '',
      error: null,
    }));
  }, []);

  const clearTranscripts = useCallback(() => {
    setState(prev => ({
      ...prev,
      committedTranscripts: [],
      partialTranscript: ''
    }));
  }, []);

  const isTokenAvailable = Boolean(token);

  return {
    ...state,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    clearTranscripts,
    isTokenAvailable,
  };
}
