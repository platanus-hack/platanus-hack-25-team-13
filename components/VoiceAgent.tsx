'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import type { FeedbackResult } from '@/types/case';

type AgentState = 'idle' | 'listening' | 'initiating' | 'generating' | 'speaking';

interface VoiceAgentProps {
  token: string;
  caseInfo: {
    message: string;
    patient: {
      edad: number;
      sexo: string;
      ocupacion: string;
      contexto_ingreso: string;
    };
    simulationId: string;
    specialty: string;
    difficulty: string;
  };
  onFeedback?: (feedback: FeedbackResult) => void;
  onSimulationEnd?: () => void;
}

export default function VoiceAgent({ token, caseInfo, onFeedback, onSimulationEnd }: VoiceAgentProps) {
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const hasPlayedInitialRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);
  const hasConnectedRef = useRef(false);

  const recorder = useVoiceRecorder({
    token,
    languageCode: "es",
    modelId: "scribe_v2_realtime",
    autoConnect: false,
  });

  // Función para reproducir audio con streaming - memoizada
  const playTTSStream = useCallback(async (text: string) => {
    if (!text || text.trim() === '') {
      console.warn('⚠️ Texto vacío, no se reproducirá');
      setAgentState('idle');
      return;
    }

    console.log('🔊 Iniciando reproducción TTS:', text.substring(0, 50) + '...');

    if (currentAudioRef.current) {
      console.log('🛑 Deteniendo audio anterior');
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }

    // Timeout de seguridad - si el audio no se reproduce en 15 segundos, volver a idle
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Timeout: El audio no se reprodujo en 15 segundos');
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
        currentAudioRef.current = null;
      }
      setAgentState('idle');
    }, 15000);

    try {
      const res = await fetch(
        `http://127.0.0.1:54321/functions/v1/text-to-speech?` +
          new URLSearchParams({ text }),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        }
      );

      if (!res.ok || !res.body) {
        const errorText = await res.text();
        console.error("❌ TTS failed:", errorText);
        clearTimeout(safetyTimeout);
        setAgentState('idle');
        return;
      }

      console.log('✅ Stream de audio recibido');

      const mediaSource = new MediaSource();
      const audioUrl = URL.createObjectURL(mediaSource);
      const audio = new Audio();
      audio.src = audioUrl;

      // Guardar referencia para poder detenerlo si es necesario
      currentAudioRef.current = audio;

      // Manejadores de eventos del audio
      const handleCanPlay = () => {
        console.log('🎵 Audio listo para reproducir');
      };

      const handlePlaying = () => {
        console.log('▶️ Audio se está reproduciendo - cambiando a speaking');
        clearTimeout(safetyTimeout); // Limpiar timeout de seguridad
        setAgentState('speaking');
      };

      const handleEnded = () => {
        console.log('✅ Audio terminado - volviendo a idle para permitir nueva grabación');
        clearTimeout(safetyTimeout); // Limpiar timeout de seguridad
        setAgentState('idle');
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      const handleError = (e: Event) => {
        const audioError = (e.target as HTMLAudioElement)?.error;
        console.error('❌ Error en reproducción de audio:', {
          event: e,
          error: audioError,
          code: audioError?.code,
          message: audioError?.message
        });
        clearTimeout(safetyTimeout); // Limpiar timeout de seguridad
        setAgentState('idle');
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      const handleWaiting = () => {
        console.log('⏳ Audio esperando más datos...');
      };

      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('waiting', handleWaiting);

      // Esperar a que MediaSource esté listo
      mediaSource.addEventListener("sourceopen", async () => {
        try {
          const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
          const reader = res.body!.getReader();
          let isReading = true;
          let hasStartedPlayback = false;

          const pump = async (): Promise<void> => {
            if (!isReading) return;

            try {
              const { value, done } = await reader.read();

              if (done) {
                console.log('📦 Todos los chunks recibidos');
                if (mediaSource.readyState === 'open') {
                  mediaSource.endOfStream();
                }
                return;
              }

              if (sourceBuffer.updating) {
                // Esperar a que termine la actualización actual
                await new Promise(resolve => {
                  sourceBuffer.addEventListener('updateend', resolve, { once: true });
                });
              }

              if (mediaSource.readyState === 'open' && !sourceBuffer.updating) {
                sourceBuffer.appendBuffer(value);
                await new Promise(resolve => {
                  sourceBuffer.addEventListener('updateend', resolve, { once: true });
                });

                // Iniciar reproducción después del primer chunk si no se ha iniciado aún
                if (!hasStartedPlayback && sourceBuffer.buffered.length > 0) {
                  hasStartedPlayback = true;
                  console.log('▶️ Suficientes datos en buffer, iniciando reproducción');
                  try {
                    await audio.play();
                    console.log('✅ Reproducción iniciada exitosamente');
                  } catch (playError) {
                    console.error('❌ Error al iniciar reproducción:', playError);
                    clearTimeout(safetyTimeout);
                    setAgentState('idle');
                    isReading = false;
                    return;
                  }
                }

                pump(); // Continuar con el siguiente chunk
              }
            } catch (error) {
              console.error('❌ Error en pump:', error);
              isReading = false;
              clearTimeout(safetyTimeout);
              setAgentState('idle');
            }
          };

          // Iniciar el pump
          pump();
        } catch (error) {
          console.error('❌ Error configurando sourceBuffer:', error);
          clearTimeout(safetyTimeout);
          setAgentState('idle');
        }
      });

    } catch (error) {
      console.error('❌ Error al reproducir TTS:', error);
      clearTimeout(safetyTimeout);
      setAgentState('idle');
    }
  }, []);

  // Función para procesar transcripción - memoizada
  const processTranscript = useCallback(async (text: string) => {
    if (isProcessingRef.current) {
      console.warn('⚠️ Ya hay un procesamiento en curso');
      return;
    }

    console.log('📝 Procesando transcripción:', text);
    isProcessingRef.current = true;
    setAgentState('generating');

    try {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text, simulationId: caseInfo.simulationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del engine:', errorData);
        throw new Error(`Error en la respuesta del engine: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta completa del engine:', data);

      // Extraer información de la respuesta
      const actionTaken = data.data?.actionTaken;
      const agentResponse = data.data?.response || data.response;
      const feedback = data.data?.feedback;
      const reasoning = data.data?.reasoning;

      console.log('🎯 Acción detectada:', actionTaken);
      console.log('🎯 Razonamiento:', reasoning);

      // Manejar diferentes acciones
      switch (actionTaken) {
        case 'patient_interaction':
          // Continuar conversación normal - reproducir respuesta del paciente
          console.log('💬 Interacción con paciente:', agentResponse);
          if (agentResponse && agentResponse.trim()) {
            await playTTSStream(agentResponse);
          } else {
            console.warn('⚠️ No hay respuesta del paciente');
            setAgentState('idle');
          }
          break;

        case 'submit_diagnosis':
          // El usuario presentó un diagnóstico - mostrar feedback
          console.log('📋 Diagnóstico presentado - generando feedback');
          
          // Reproducir mensaje de confirmación si existe
          if (agentResponse && agentResponse.trim()) {
            await playTTSStream(agentResponse);
          }
          
          // Ejecutar callback con el feedback
          if (feedback && onFeedback) {
            console.log('📊 Feedback generado:', feedback);
            // Esperar un momento después del audio para mostrar el feedback
              onFeedback(feedback);
          
          } else {
            setAgentState('idle');
          }
          break;

        case 'end_simulation':
          // El usuario quiere terminar la simulación
          console.log('🏁 Finalizando simulación');
          
          // Reproducir mensaje de despedida si existe
          // Ejecutar callback de finalización
          if (onSimulationEnd) {
            // Esperar un momento después del audio
            setTimeout(() => {
              onSimulationEnd();
            }, agentResponse ? 2000 : 0);
          } else {
            setAgentState('idle');
          }
          break;

        default:
          console.warn('⚠️ Acción desconocida:', actionTaken);
          if (agentResponse && agentResponse.trim()) {
            await playTTSStream(agentResponse);
          } else {
            setAgentState('idle');
          }
      }
    } catch (error) {
      console.error('❌ Error al procesar transcripción:', error);
      setAgentState('idle');
    } finally {
      isProcessingRef.current = false;
    }
  }, [caseInfo.simulationId, playTTSStream, onFeedback, onSimulationEnd]);

  // Conectar a Eleven Labs - SOLO UNA VEZ al montar
  useEffect(() => {
    // Si ya intentamos conectar o ya está conectado, no hacer nada

    if (!token || token.trim() === '') {
      console.log('⏭️ No hay token disponible');
      return;
    }

    // Marcar que ya iniciamos la conexión ANTES de intentar
    hasConnectedRef.current = true;

    const connectToRecorder = async () => {
      try {
        console.log('🔄 Conectando a Eleven Labs con token:', token.substring(0, 10) + '...');
        await recorder.connect();
        console.log("✅ Conectado exitosamente a Eleven Labs");
        console.log("📊 Estado del recorder:", {
          isConnected: recorder.isConnected,
          isRecording: recorder.isRecording,
          hasError: !!recorder.error
        });
      } catch (error) {
        console.error('❌ Error al conectar:', error);
        // NO resetear hasConnectedRef porque el token ya se consumió
        // hasConnectedRef.current = false;
      }
    };

    // Pequeño delay para evitar race conditions
    const timeout = setTimeout(connectToRecorder, 300);

    return () => {
      console.log('🧹 Cleanup de VoiceAgent - cancelando timeout si existe');
      clearTimeout(timeout);
      // NO desconectar ni resetear hasConnectedRef en cleanup para evitar problemas con Strict Mode
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
        currentAudioRef.current = null;
      }
    };
  }, []); // Array vacío para ejecutar SOLO una vez, independiente del token

  // Reproducir mensaje inicial - SOLO UNA VEZ
  useEffect(() => {
    // Esperar a que esté conectado
    if (!hasPlayedInitialRef.current &&
        caseInfo.message &&
        caseInfo.message.trim() !== '' &&
        recorder.isConnected) {

      console.log('🎬 Iniciando reproducción del mensaje inicial del caso');
      hasPlayedInitialRef.current = true;

      // Cambiar a initiating para el primer mensaje
      setAgentState('initiating');

      // Pequeño delay para asegurar que el estado se actualizó
      setTimeout(() => {
        console.log('🔊 Reproduciendo mensaje inicial:', caseInfo.message.substring(0, 50) + '...');
        playTTSStream(caseInfo.message);
      }, 500);
    }
  }, [caseInfo.message, recorder.isConnected, playTTSStream]);

  // Controlar modo escucha automáticamente según el estado
  useEffect(() => {
    if (!recorder.isConnected) return;

    // Activar escucha cuando está en idle (esperando que el usuario hable)
    // PERO solo después de haber reproducido el mensaje inicial
    if (agentState === 'idle' && !recorder.isRecording && hasPlayedInitialRef.current) {
      console.log('🎤 Activando modo escucha - esperando consulta del usuario');
      recorder.startRecording();
      setIsRecording(true);
    }

    // Desactivar escucha cuando está iniciando, generando respuesta o hablando
    if ((agentState === 'initiating' || agentState === 'generating' || agentState === 'speaking') && recorder.isRecording) {
      console.log('🔇 Desactivando modo escucha');
      recorder.stopRecording();
      setIsRecording(false);
    }
  }, [agentState, recorder]);

  // Escuchar transcripciones confirmadas y procesarlas automáticamente
  useEffect(() => {
    if (recorder.committedTranscripts.length === 0) return;

    const lastTranscript = recorder.committedTranscripts[recorder.committedTranscripts.length - 1];

    // Solo procesar si no estamos ya procesando y no es una transcripción vacía
    if (!isProcessingRef.current && lastTranscript.text.trim() !== '') {
      setAgentState('generating');
      recorder.clearTranscripts(); // Limpiar para evitar reprocesar
      processTranscript(lastTranscript.text);
    }
  }, [recorder.committedTranscripts, processTranscript, recorder]);

  useEffect(() => {
    return () => {
      if (recorder.isConnected) {
        recorder.disconnect();
      }
    };
  }, []);

  // Función helper para obtener el texto descriptivo del estado
  const getStateText = () => {
    if (!recorder.isConnected) return { title: 'Conectando', subtitle: 'Estableciendo conexión con el servicio de voz' };

    switch (agentState) {
      case 'idle':
        return isRecording
          ? { title: 'Escuchando', subtitle: 'Puedes hablar libremente' }
          : { title: 'Listo', subtitle: 'Esperando activación automática' };
      case 'listening':
        return { title: 'Escuchando', subtitle: 'Habla naturalmente, la IA detectará cuando termines' };
      case 'initiating':
        return { title: 'Iniciando', subtitle: 'Preparando caso clínico' };
      case 'generating':
        return { title: 'Procesando', subtitle: 'Analizando tu consulta y generando respuesta' };
      case 'speaking':
        return { title: 'Paciente Hablando', subtitle: 'Escucha la respuesta del paciente virtual' };
      default:
        return { title: 'Listo', subtitle: 'Sistema preparado' };
    }
  };

  return (
    <div className="h-full bg-white overflow-y-auto p-6">
      <div className="w-full max-w-2xl mx-auto pt-8 ">
        {/* Información del caso */}
        {/* <div className="mb-6 bg-white rounded-xl p-6 border border-[#00072d]/10 shadow-sm">
          <h3 className="text-[#1098f7] font-semibold mb-4 text-xs uppercase tracking-widest">
            Información del Caso
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#00072d]/5">
              <div>
                <span className="text-[#00072d]/50 text-xs uppercase tracking-wide block mb-1 font-medium">Paciente</span>
                <span className="text-[#00072d] text-sm">{caseInfo.patient.sexo}, {caseInfo.patient.edad} años</span>
              </div>
              <div>
                <span className="text-[#00072d]/50 text-xs uppercase tracking-wide block mb-1 font-medium">Ocupación</span>
                <span className="text-[#00072d] text-sm">{caseInfo.patient.ocupacion}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#00072d]/50 text-xs uppercase tracking-wide block mb-1 font-medium">Contexto de Ingreso</span>
                <span className="text-[#00072d] text-sm">{caseInfo.patient.contexto_ingreso}</span>
              </div>
            </div>
          </div>
        </div> */}

        {/* Error */}
        {recorder.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-red-700 text-sm font-semibold mb-2">
              Error de Conexión
            </div>
            <p className="text-red-600 text-xs mb-3">{recorder.error}</p>
            <ul className="text-red-600/80 text-xs space-y-1 list-disc list-inside">
              <li>Verifica que la variable ELEVENLABS_API_KEY esté configurada</li>
              <li>Permite el acceso al micrófono en tu navegador</li>
              <li>Recarga la página e intenta nuevamente</li>
            </ul>
          </div>
        )}

        {/* Área principal - Estado y control */}
        <div className="bg-gradient-to-br from-[#00072d] to-[#001c55] rounded-xl p-8 shadow-lg">
          <div className="flex flex-col items-center gap-6">
            {/* Visualizador de ondas */}
            <div className="relative w-full h-32 flex items-center justify-center">
              <SoundWaves state={isRecording ? 'listening' : agentState} />
            </div>

            {/* Estado actual */}
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-1">
                {getStateText().title}
              </h2>
              <p className="text-white/60 text-sm">
                {getStateText().subtitle}
              </p>
            </div>

            {/* Indicador de estado visual */}
            <div className="flex items-center gap-3">
              {/* Indicador de conexión */}
              <div className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${recorder.isConnected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 animate-pulse'}
              `} />

              {/* Indicador de escucha activa */}
              {isRecording && (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1098f7]/20 rounded-full border border-[#1098f7]/30">
                  <div className="w-2 h-2 bg-[#1098f7] rounded-full animate-pulse" />
                  <span className="text-[#1098f7] text-xs font-medium">Escuchando</span>
                </div>
              )}

              {/* Indicador de inicio */}
              {agentState === 'initiating' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-blue-500 text-xs font-medium">Iniciando</span>
                </div>
              )}

              {/* Indicador de generación */}
              {agentState === 'generating' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                  <div className="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                  <span className="text-yellow-500 text-xs font-medium">Generando</span>
                </div>
              )}

              {/* Indicador de respuesta */}
              {agentState === 'speaking' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30">
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-purple-500 text-xs font-medium">Hablando</span>
                </div>
              )}
            </div>

            <p className="text-white/50 text-xs font-medium text-center max-w-md">
              {!recorder.isConnected && 'Conectando con el servicio de voz...'}
              {recorder.isConnected && agentState === 'idle' && 'Conversación con detección automática de voz'}
              {isRecording && 'Habla naturalmente, la IA detectará cuando termines'}
              {agentState === 'initiating' && 'Preparando el caso clínico para comenzar la simulación...'}
              {agentState === 'generating' && 'Analizando tu consulta y generando respuesta del paciente...'}
              {agentState === 'speaking' && 'El paciente virtual está respondiendo'}
            </p>
          </div>
        </div>

        {/* Transcripción en tiempo real */}
        {isRecording && recorder.partialTranscript && (
          <div className="mt-6 bg-[#1098f7]/5 rounded-xl p-6 border border-[#1098f7]/20 animate-slide-up">
            <div className="text-[#1098f7] text-xs uppercase tracking-widest mb-3 font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-[#1098f7] rounded-full animate-pulse" />
              Transcripción en tiempo real
            </div>
            <p className="text-[#00072d] text-base leading-relaxed">
              {recorder.partialTranscript}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de ondas de sonido
function SoundWaves({ state }: { state: AgentState }) {
  const getWaveConfig = () => {
    switch (state) {
      case 'idle':
        return {
          bars: 5,
          color: 'bg-white/20',
          heights: [8, 12, 16, 12, 8],
          animate: false
        };
      case 'listening':
        return {
          bars: 9,
          color: 'bg-[#1098f7]',
          heights: [20, 35, 50, 65, 80, 65, 50, 35, 20],
          animate: true
        };
      case 'initiating':
        return {
          bars: 7,
          color: 'bg-blue-500/70',
          heights: [25, 40, 55, 70, 55, 40, 25],
          animate: true
        };
      case 'generating':
        return {
          bars: 7,
          color: 'bg-yellow-500/70',
          heights: [25, 40, 55, 70, 55, 40, 25],
          animate: true
        };
      case 'speaking':
        return {
          bars: 9,
          color: 'bg-purple-500',
          heights: [15, 30, 45, 60, 75, 60, 45, 30, 15],
          animate: true
        };
      default:
        return {
          bars: 5,
          color: 'bg-white/20',
          heights: [8, 12, 16, 12, 8],
          animate: false
        };
    }
  };

  const config = getWaveConfig();

  return (
    <div className="flex items-center justify-center gap-1.5 h-full">
      {[...Array(config.bars)].map((_, i) => (
        <div
          key={i}
          className={`
            w-1.5 rounded-full transition-all duration-300
            ${config.color}
            ${config.animate ? 'animate-wave' : ''}
          `}
          style={{
            height: `${config.heights[i]}px`,
            animationDelay: config.animate ? `${i * 0.08}s` : '0s',
            animationDuration: state === 'listening' ? '0.8s' : (state === 'initiating' || state === 'generating') ? '1.2s' : '1s'
          }}
        />
      ))}

      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(1);
            opacity: 0.8;
          }
          50% {
            transform: scaleY(1.4);
            opacity: 1;
          }
        }

        .animate-wave {
          animation: wave ease-in-out infinite;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease;
        }
      `}</style>
    </div>
  );
}
