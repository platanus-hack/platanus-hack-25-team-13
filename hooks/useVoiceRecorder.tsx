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
        console.log('✅ Permisos del micrófono obtenidos');
        stream.getTracks().forEach(track => track.stop());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (micError) {
        console.error('❌ Permisos del micrófono denegados');
        setState(prev => ({
          ...prev,
          error: 'Permisos del micrófono denegados. Por favor, permite el acceso al micrófono.'
        }));
        throw new Error('Microphone permission denied');
      }

      console.log('📞 Iniciando conexión Scribe con token...');

      // Crear promesa para esperar la conexión
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

        // Timeout de 10 segundos para la conexión
        const timeout = setTimeout(() => {
          reject(new Error('Timeout esperando conexión'));
        }, 10000);

        // Esperar a que la sesión inicie
        connection.on(RealtimeEvents.SESSION_STARTED, () => {
          clearTimeout(timeout);
          console.log('✅ SESSION_STARTED - Sesión iniciada');
          setState(prev => ({ ...prev, isConnected: true, error: null }));
          resolve(connection);
        });

        // Manejar errores de conexión
        connection.on(RealtimeEvents.AUTH_ERROR, (...args: unknown[]) => {
          clearTimeout(timeout);
          const error = args[0] as AuthErrorData;
          console.error('❌ AUTH_ERROR:', error);
          reject(new Error(`Error de autenticación: ${error.error || 'Token inválido'}`));
        });

        connection.on(RealtimeEvents.CLOSE, (...args: unknown[]) => {
          clearTimeout(timeout);
          const closeEvent = args[0] as { code?: number; reason?: string };
          if (closeEvent?.code === 1006) {
            console.error('❌ Conexión cerrada anormalmente (código 1006)');
            reject(new Error('Conexión cerrada inesperadamente'));
          }
        });
      });

      const connection = await connectionPromise;
      connectionRef.current = connection;

      // Agregar listeners para transcripciones y otros eventos
      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (...args: unknown[]) => {
        const data = args[0] as PartialTranscriptData;
        if (recordingStateRef.current && data.text) {
          console.log('📝 Transcripción parcial:', data.text);
          setState(prev => ({
            ...prev,
            partialTranscript: data.text || ''
          }));
        }
      });

      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (...args: unknown[]) => {

        const data = args[0] as CommittedTranscriptData;
        console.log('✅ Transcripción confirmada (VAD):', data.text);

        // Con VAD, solo procesamos si está en modo de escucha activa
        if (!recordingStateRef.current) {
          console.log('⏭️ Ignorando transcripción - no estamos en modo escucha');
          return;
        }

        // Ignorar transcripciones vacías
        if (!data.text || data.text.trim() === '') {
          console.log('⏭️ Ignorando transcripción vacía');
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
        console.error('❌ ERROR evento:', error);
        setState(prev => ({
          ...prev,
          error: error.message || 'Error desconocido',
          isRecording: false
        }));
        recordingStateRef.current = false;
      });

      connection.on(RealtimeEvents.AUTH_ERROR, (...args: unknown[]) => {
        const error = args[0] as AuthErrorData;
        console.error('❌ AUTH_ERROR:', error);
        setState(prev => ({
          ...prev,
          error: `Error de autenticación: ${error.error || 'Token inválido'}`,
          isRecording: false
        }));
        recordingStateRef.current = false;
      });

      connection.on(RealtimeEvents.CLOSE, (...args: unknown[]) => {
        const closeEvent = args[0] as { code?: number; reason?: string };
        console.warn('⚠️ CLOSE evento:', closeEvent);

        recordingStateRef.current = false;

        if (closeEvent?.code === 1006) {
          console.error('❌ Conexión cerrada anormalmente (código 1006)');
          setState(prev => ({
            ...prev,
            isConnected: false,
            isRecording: false,
            error: 'Conexión cerrada inesperadamente. Verifica token y permisos.'
          }));
        } else {
          console.log('✅ Conexión cerrada normalmente');
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
      throw error; // Propagar el error para que el retry lo maneje
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
  }, []); // Solo ejecutar al desmontar, no cuando cambia el token

  const startRecording = useCallback(() => {

    console.log('🎙️ Activando modo escucha (VAD automático)');

    if (!state.isConnected || state.isRecording) {
      console.warn('⚠️ No se puede activar escucha:', {
        isConnected: state.isConnected,
        isRecording: state.isRecording
      });
      return;
    }

    recordingStateRef.current = true;
    setState(prev => ({
      ...prev,
      isRecording: true,
      partialTranscript: '',
      error: null
    }));
    console.log('✅ Modo escucha activado - VAD detectará automáticamente cuando hables');
  }, [state.isConnected, state.isRecording]);

  // Desactivar modo escucha (pausar VAD)
  const stopRecording = useCallback(() => {
    console.log('🛑 Desactivando modo escucha');

    if (!state.isRecording) {
      console.warn('⚠️ Modo escucha ya está desactivado');
      return;
    }

    recordingStateRef.current = false;
    setState(prev => ({ ...prev, isRecording: false, partialTranscript: '' }));
    console.log("✅ Modo escucha desactivado - ya no se procesarán transcripciones");
  }, [state.isRecording]);

  // Desconectar WebSocket
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
