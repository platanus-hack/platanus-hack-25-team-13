"use client";

import { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { FaStethoscope } from "react-icons/fa";
import type { ClinicalCase, ChatMessage, RequestedExam, StudentManagementPlan } from "@/types/case";
import AntecedentesMedicos from "../../components/anamnesis/AntecedentesMedicos";
import Consulta from "../../components/anamnesis/Consulta";
import Diagnostico from "../../components/anamnesis/Diagnostico";
import Feedback from "../../components/anamnesis/Feedback";
import ChatInput from "../../components/anamnesis/ChatInput";
import ChatImage from "../../components/anamnesis/ChatImage";
import Stepper from "../../components/Stepper";
import ManagementPlanModal from "../../components/ManagementPlanModal";
import { useAuth } from "@/hooks/useAuth";
import { useAnamnesis } from "@/hooks/useAnamnesis";
import { useAnamnesisMessages } from "@/hooks/useAnamnesisMessages";
import { supabase } from "@/lib/supabase";

function AnamnesisPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { getAnamnesisById } = useAnamnesis();
  const { addMessage, getMessages } = useAnamnesisMessages();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pacienteData, setPacienteData] = useState<any>(null);
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [examImageUrl, setExamImageUrl] = useState<string | null>(null);
  const [requestedExams, setRequestedExams] = useState<RequestedExam[]>([]);
  const [currentExamIndex, setCurrentExamIndex] = useState<number>(0);
  const [showExamViewer, setShowExamViewer] = useState<boolean>(false);
  const [caseStartTime, setCaseStartTime] = useState<Date | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [detectedDiagnosis, setDetectedDiagnosis] = useState<string>("");
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [anamnesisId, setAnamnesisId] = useState<number | null>(null);

  // Set mounted to true when component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detectar modo revisión desde URL
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        setIsReviewMode(true);
        setAnamnesisId(id);
        loadReviewData(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Cargar datos de revisión
  const loadReviewData = async (id: number) => {
    try {
      const anamnesis = await getAnamnesisById(id);
      if (anamnesis) {
        // Cargar datos del caso desde summary
        if (anamnesis.summary && typeof anamnesis.summary === 'string') {
          try {
            const caseData = JSON.parse(anamnesis.summary);
            const simulationDebug = caseData["simulation-debug"];
            const clinicalCaseData = simulationDebug?.clinicalCase;
            const patientInfo = caseData.patientInfo;

            if (clinicalCaseData && patientInfo) {
              // Construir datos del paciente
              const sexoCapitalizado = patientInfo.sexo.charAt(0).toUpperCase() + patientInfo.sexo.slice(1);
              const pacienteDataFromCase = {
                nombre: `Paciente ${patientInfo.sexo === "femenino" ? "Femenino" : patientInfo.sexo === "masculino" ? "Masculino" : ""}`,
                edad: patientInfo.edad,
                sexo: sexoCapitalizado,
                ocupacion: patientInfo.ocupacion,
                motivoConsulta: clinicalCaseData.motivo_consulta || "",
                contextoIngreso: patientInfo.contexto_ingreso || "",
              };
              setPacienteData(pacienteDataFromCase);

              // Construir ClinicalCase
              const fullClinicalCase: ClinicalCase = {
                id: clinicalCaseData.id || caseData.simulationId || "1",
                especialidad: caseData.especialidad || clinicalCaseData.especialidad || "aps",
                nivel_dificultad: caseData.nivel_dificultad || clinicalCaseData.nivel_dificultad || "medio",
                aps_subcategoria: clinicalCaseData.aps_subcategoria,
                paciente: {
                  edad: patientInfo.edad,
                  sexo: patientInfo.sexo as "masculino" | "femenino" | "otro",
                  ocupacion: patientInfo.ocupacion,
                  contexto_ingreso: patientInfo.contexto_ingreso,
                },
                motivo_consulta: clinicalCaseData.motivo_consulta || "",
                sintomas: clinicalCaseData.sintomas || { descripcion_general: "", detalle: [] },
                antecedentes: {
                  personales: clinicalCaseData.antecedentes?.personales || [],
                  familiares: clinicalCaseData.antecedentes?.familiares || [],
                  farmacos: clinicalCaseData.antecedentes?.farmacos || [],
                  alergias: clinicalCaseData.antecedentes?.alergias || [],
                },
                examen_fisico: clinicalCaseData.examen_fisico || {
                  signos_vitales: { temperatura: 36.5, frecuencia_cardiaca: 90, presion_arterial: "140/90", frecuencia_respiratoria: 20, saturacion_o2: 98 },
                  hallazgos_relevantes: [],
                },
                examenes: clinicalCaseData.examenes || {},
                diagnostico_principal: clinicalCaseData.diagnostico_principal || "",
                diagnosticos_diferenciales: clinicalCaseData.diagnosticos_diferenciales || [],
                info_oculta: clinicalCaseData.info_oculta || [],
                info_prohibida: clinicalCaseData.info_prohibida || [],
                manejo_aps: clinicalCaseData.manejo_aps,
              };
              setClinicalCase(fullClinicalCase);

              // Cargar initialMessage si existe
              if (caseData.initialMessage) {
                setInitialMessage(caseData.initialMessage);
              }
            }
          } catch (e) {
            console.error("Error parsing anamnesis summary:", e);
          }
        }

        // Cargar feedback si existe
        if (anamnesis.feedback_data) {
          setFeedbackData(anamnesis.feedback_data);
        }

        // Cargar mensajes guardados
        const savedMessages = await getMessages(id);
        if (savedMessages && savedMessages.length > 0) {
          const chatMessages: ChatMessage[] = savedMessages.map((msg) => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.message,
            timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
          }));
          setMessages(chatMessages);
          console.log(`✅ Cargados ${chatMessages.length} mensajes desde Supabase para modo revisión`);
        } else {
          console.log("ℹ️ No hay mensajes guardados para esta anamnesis");
        }
        
        // Determinar el paso inicial basado en los datos disponibles
        // En modo revisión, el usuario puede navegar libremente, pero empezamos en el paso más avanzado
        if (anamnesis.feedback_data) {
          setCurrentStep(2); // Feedback
        } else if (savedMessages && savedMessages.length > 0) {
          setCurrentStep(1); // Consulta
        } else {
          setCurrentStep(0); // Antecedentes
        }
      }
    } catch (error) {
      console.error("Error loading review data:", error);
    }
  };

  // Cargar datos del caso generado desde home
  useEffect(() => {
    if (isReviewMode) return; // No cargar desde sessionStorage si está en modo revisión
    
    const savedCase = sessionStorage.getItem("generatedCase");
    if (savedCase) {
      try {
        const parsedCase = JSON.parse(savedCase);
        const simulationDebug = parsedCase["simulation-debug"];
        const clinicalCaseData = simulationDebug?.clinicalCase;
        const patientInfo = parsedCase.patientInfo;

        if (clinicalCaseData && patientInfo) {
          // Guardar simulationId
          if (parsedCase.simulationId) {
            setSimulationId(parsedCase.simulationId);
          }

          // Guardar initialMessage
          if (parsedCase.initialMessage) {
            setInitialMessage(parsedCase.initialMessage);
          }

          // Guardar publicId y tiempo de inicio
          if (parsedCase.publicId) {
            setPublicId(parsedCase.publicId);
          }
          
          // Guardar anamnesisId si está disponible
          if (parsedCase.anamnesisId) {
            setAnamnesisId(parsedCase.anamnesisId);
            console.log("✅ anamnesisId establecido desde sessionStorage:", parsedCase.anamnesisId);
          } else {
            console.warn("⚠️ No se encontró anamnesisId en el caso guardado");
          }
          
          // Guardar tiempo de inicio para calcular duración
          const startTime = parsedCase.startTime || parsedCase.createdAt;
          if (startTime) {
            setCaseStartTime(new Date(startTime));
          } else {
            setCaseStartTime(new Date()); // Si no hay, usar ahora
          }

          // Capitalizar sexo
          const sexoCapitalizado = patientInfo.sexo.charAt(0).toUpperCase() + patientInfo.sexo.slice(1);
          
          // Construir datos del paciente para AntecedentesMedicos
          const pacienteDataFromCase = {
            nombre: `Paciente ${patientInfo.sexo === "femenino" ? "Femenino" : patientInfo.sexo === "masculino" ? "Masculino" : ""}`,
            edad: patientInfo.edad,
            sexo: sexoCapitalizado,
            ocupacion: patientInfo.ocupacion,
            motivoConsulta: clinicalCaseData.motivo_consulta || "",
            contextoIngreso: patientInfo.contexto_ingreso || "",
          };

          setPacienteData(pacienteDataFromCase);

          // Construir ClinicalCase completo
          const fullClinicalCase: ClinicalCase = {
            id: clinicalCaseData.id || parsedCase.simulationId || "1",
            especialidad: parsedCase.especialidad || clinicalCaseData.especialidad || "aps",
            nivel_dificultad: parsedCase.nivel_dificultad || clinicalCaseData.nivel_dificultad || "medio",
            aps_subcategoria: clinicalCaseData.aps_subcategoria,
            paciente: {
              edad: patientInfo.edad,
              sexo: patientInfo.sexo as "masculino" | "femenino" | "otro",
              ocupacion: patientInfo.ocupacion,
              contexto_ingreso: patientInfo.contexto_ingreso,
            },
            motivo_consulta: clinicalCaseData.motivo_consulta || "",
            sintomas: clinicalCaseData.sintomas || {
              descripcion_general: "",
              detalle: [],
            },
            antecedentes: {
              personales: clinicalCaseData.antecedentes?.personales || [],
              familiares: clinicalCaseData.antecedentes?.familiares || [],
              farmacos: clinicalCaseData.antecedentes?.farmacos || [],
              alergias: clinicalCaseData.antecedentes?.alergias || [],
            },
            examen_fisico: clinicalCaseData.examen_fisico || {
              signos_vitales: {
                temperatura: 36.5,
                frecuencia_cardiaca: 90,
                presion_arterial: "140/90",
                frecuencia_respiratoria: 20,
                saturacion_o2: 98,
              },
              hallazgos_relevantes: [],
            },
            examenes: clinicalCaseData.examenes || {},
            diagnostico_principal: clinicalCaseData.diagnostico_principal || "",
            diagnosticos_diferenciales: clinicalCaseData.diagnosticos_diferenciales || [],
            info_oculta: clinicalCaseData.info_oculta || [],
            info_prohibida: clinicalCaseData.info_prohibida || [],
            manejo_aps: clinicalCaseData.manejo_aps,
          };

          setClinicalCase(fullClinicalCase);
          sessionStorage.removeItem("generatedCase");
        }
      } catch (e) {
        console.error("Error parsing saved case:", e);
      }
    }
  }, []);

  // Datos por defecto si no hay caso generado
  const defaultPacienteData = {
    nombre: "María González",
    edad: 45,
    sexo: "Femenino",
    ocupacion: "Profesora",
    motivoConsulta: "Paciente de 45 años que acude a consulta por dolor torácico de inicio súbito hace 2 horas, acompañado de disnea y sudoración. Refiere antecedente de hipertensión arterial en tratamiento.",
    antecedentesPersonales: "Hipertensión arterial desde hace 5 años. Diabetes tipo 2 diagnosticada hace 3 años. No fumadora. Sedentaria.",
    contextoIngreso: "Paciente llega al servicio de urgencias en ambulancia tras presentar dolor torácico intenso. Se encuentra hemodinámicamente estable al ingreso. Se realiza ECG que muestra elevación del segmento ST en derivaciones anteroseptales.",
    medicamentosYAlergias: "Metformina 850mg cada 12 horas. Losartán 50mg diario. No alergias conocidas a medicamentos."
  };

  const defaultClinicalCase: ClinicalCase = {
    id: "1",
    especialidad: "urgencia",
    nivel_dificultad: "medio",
    paciente: {
      edad: defaultPacienteData.edad,
      sexo: defaultPacienteData.sexo.toLowerCase() as "masculino" | "femenino" | "otro",
      ocupacion: defaultPacienteData.ocupacion,
      contexto_ingreso: defaultPacienteData.contextoIngreso,
    },
    motivo_consulta: defaultPacienteData.motivoConsulta,
    sintomas: {
      descripcion_general: "Dolor torácico de inicio súbito",
      detalle: ["Dolor torácico", "Disnea", "Sudoración"],
    },
    antecedentes: {
      personales: defaultPacienteData.antecedentesPersonales.split(". "),
      familiares: [],
      farmacos: defaultPacienteData.medicamentosYAlergias.split(". "),
      alergias: [],
    },
    examen_fisico: {
      signos_vitales: {
        temperatura: 36.5,
        frecuencia_cardiaca: 90,
        presion_arterial: "140/90",
        frecuencia_respiratoria: 20,
        saturacion_o2: 98,
      },
      hallazgos_relevantes: [],
    },
    examenes: {},
    diagnostico_principal: "",
    diagnosticos_diferenciales: [],
    info_oculta: [],
    info_prohibida: [],
  };

  const finalPacienteData = pacienteData || defaultPacienteData;
  const finalClinicalCase = clinicalCase || defaultClinicalCase;

  const steps = [
    { title: "Antecedentes" },
    { title: "Consulta y Diagnostico" },
    { title: "Finalizar" },
  ];

  const handleStartConsulta = async () => {
    setCurrentStep(1);
    setMessages([]);
    setTimeout(async () => {
      const firstMessage = initialMessage || 
        (finalClinicalCase.motivo_consulta 
          ? finalClinicalCase.motivo_consulta
          : "Hola");
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: firstMessage,
        timestamp: new Date(),
      };
      
      setMessages([assistantMessage]);
      
      // Guardar mensaje inicial del asistente si tenemos anamnesisId
      if (anamnesisId) {
        try {
          await addMessage(anamnesisId, "assistant", firstMessage);
          console.log("✅ Mensaje inicial del asistente guardado en Supabase");
        } catch (error) {
          console.error("❌ Error saving initial assistant message:", error);
        }
      } else {
        console.warn("⚠️ No anamnesisId disponible para guardar mensaje inicial del asistente");
      }
    }, 2000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__DEV_NEXT_STEP = handleDevNext;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__DEV_NEXT_STEP;
      }
    };
  }, [finalClinicalCase]);

  const handleDevNext = () => {
    // DEV: Go directly to feedback step with mockup data
    const mockFeedback = {
      puntajes: {
        anamnesis_motivo_consulta: 5.5,
        identificacion_sintomas: 4.8,
        antecedentes: 3.5,
        razonamiento_clinico: 4.2,
        comunicacion_empatia: 6.0,
      },
      comentarios: {
        fortalezas: [
          "El estudiante mostró una buena habilidad para establecer comunicación inicial con el paciente.",
          "Fue capaz de explorar adecuadamente el motivo de consulta del paciente.",
        ],
        debilidades: [
          "El estudiante no exploró adecuadamente los antecedentes personales y familiares del paciente.",
          "No identificó las red flags importantes para el caso.",
          "El razonamiento clínico fue incorrecto, llevando a un diagnóstico erróneo.",
        ],
        sugerencias: [
          "Asegurarse de preguntar sobre antecedentes familiares y personales relevantes en casos respiratorios.",
          "Mejorar la identificación de signos de alarma que podrían requerir atención urgente.",
          "Revisar criterios de diagnóstico diferencial para afecciones respiratorias comunes en adultos mayores con antecedentes de tabaquismo.",
        ],
      },
      diagnostico: {
        estudiante: "infección pulmonar",
        correcto: false,
        diagnostico_real: finalClinicalCase.diagnostico_principal || "EPOC exacerbado",
        comentario: "El diagnóstico del estudiante fue incorrecto. No consideró el historial de tabaquismo y los síntomas característicos de EPOC exacerbado.",
      },
    };
    
    setFeedbackData(mockFeedback);
    setCurrentStep(2);
  };

  async function handleSend() {
    if (!input.trim() || loading) return;

    // En modo revisión, no permitir enviar mensajes
    if (isReviewMode) {
      return;
    }

    // Solo usar engine si tenemos simulationId
    if (!simulationId) {
      console.error("No simulationId available");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Guardar mensaje del usuario en Supabase si tenemos anamnesisId
    if (anamnesisId) {
      try {
        await addMessage(anamnesisId, "user", input);
        console.log("✅ Mensaje del usuario guardado en Supabase:", input.substring(0, 50));
      } catch (error) {
        console.error("❌ Error saving user message:", error);
      }
    } else {
      console.warn("⚠️ No anamnesisId disponible para guardar mensaje del usuario");
    }
    
    const messageContent = input;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/engine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          simulationId,
          message: messageContent,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data.response) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Guardar mensaje del asistente en Supabase si tenemos anamnesisId
        if (anamnesisId) {
          try {
            await addMessage(anamnesisId, "assistant", data.data.response);
            console.log("✅ Mensaje del asistente guardado en Supabase:", data.data.response.substring(0, 50));
          } catch (error) {
            console.error("❌ Error saving assistant message:", error);
          }
        } else {
          console.warn("⚠️ No anamnesisId disponible para guardar mensaje del asistente");
        }

        // Update requested exams from engine response
        if (data.data.requestedExams && Array.isArray(data.data.requestedExams)) {
          // Only show exam viewer if a NEW exam was added
          const previousExamCount = requestedExams.length;
          const newExamCount = data.data.requestedExams.length;
          const isNewExam = newExamCount > previousExamCount;

          setRequestedExams(data.data.requestedExams);

          // Only show the exam viewer if this is a new exam
          if (isNewExam) {
            const latestExam = data.data.requestedExams[data.data.requestedExams.length - 1];
            if (latestExam && latestExam.imageUrl) {
              setExamImageUrl(latestExam.imageUrl);
              setCurrentExamIndex(data.data.requestedExams.length - 1);
              setShowExamViewer(true);
            }
          }
        }

        // Check if diagnosis was submitted
        if (data.data.actionTaken === "submit_diagnosis" && data.data.feedback) {
          // Save feedback data and move to feedback step
          const feedback = data.data.feedback;
          setFeedbackData(feedback);
          setCurrentStep(2);
          
          // Save to Supabase
          if (user && publicId && caseStartTime) {
            const endTime = new Date();
            const tiempoDemora = Math.floor((endTime.getTime() - caseStartTime.getTime()) / 1000); // segundos
            
            // Calcular calificación promedio
            const promedioGeneral = feedback.puntajes
              ? Object.values(feedback.puntajes as Record<string, number>).reduce((a: number, b: number) => a + b, 0) /
                Object.keys(feedback.puntajes).length
              : 0;

            // Obtener diagnóstico final
            const diagnosticoFinal = feedback.diagnostico?.diagnostico_real || "";

            // Update anamnesis in database
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session?.access_token) {
                fetch("/api/update-anamnesis", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    public_id: publicId,
                    calificacion: promedioGeneral,
                    tiempo_demora: tiempoDemora,
                    is_completed: true,
                    diagnostico_final: diagnosticoFinal,
                    feedback_data: feedback,
                  }),
                }).then((res) => {
                  if (res.ok) {
                    console.log("Anamnesis actualizada exitosamente en Supabase");
                  } else {
                    console.error("Error actualizando anamnesis:", res.statusText);
                  }
                }).catch((err) => {
                  console.error("Error updating anamnesis:", err);
                });
              }
            });
          }
          return;
        }
      } else {
        throw new Error(data.error || "No response from engine");
      }
    } catch (error) {
      console.error("Error sending message to engine:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  const handlePreviousExam = () => {
    if (currentExamIndex > 0 && requestedExams.length > 0) {
      const newIndex = currentExamIndex - 1;
      setCurrentExamIndex(newIndex);
      if (requestedExams[newIndex]?.imageUrl) {
        setExamImageUrl(requestedExams[newIndex].imageUrl);
      }
    }
  };

  const handleNextExam = () => {
    if (currentExamIndex < requestedExams.length - 1) {
      const newIndex = currentExamIndex + 1;
      setCurrentExamIndex(newIndex);
      if (requestedExams[newIndex]?.imageUrl) {
        setExamImageUrl(requestedExams[newIndex].imageUrl);
      }
    }
  };

  const getExamLabel = (exam: RequestedExam): string => {
    const typeMap: Record<string, string> = {
      radiografia: "Radiografía",
      ecografia: "Ecografía",
      electrocardiograma: "ECG",
      tomografia: "Tomografía",
      resonancia: "Resonancia",
      laboratorio: "Laboratorio",
    };
    const type = typeMap[exam.tipo] || exam.tipo;
    const classification = exam.clasificacion ? ` - ${exam.clasificacion}` : "";
    return `${type}${classification}`;
  };
  async function handleSubmitManagementPlan(planData: StudentManagementPlan) {
    if (!simulationId) return;

    setFeedbackLoading(true);
    setShowManagementModal(false);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulationId,
          managementPlan: planData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error generando feedback");
      }

      const data = await res.json();
      
      if (data.success && data.feedback) {
        // Save feedback and move to feedback step
        setFeedbackData(data.feedback);
        setCurrentStep(2);
      } else {
        throw new Error("No se recibió feedback del servidor");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error enviando plan de manejo");
      setShowManagementModal(true); // Reabrir el modal en caso de error
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <div className={`flex flex-col ${currentStep === 0 ? 'bg-white' : 'bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff]'}`}>
      <div className={`fixed bottom-0 left-0 right-0 z-20 flex justify-center py-3 px-4 border-t border-gray-200 ${currentStep === 0 ? 'bg-white' : 'bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff]'}`}>
        <div className="w-full max-w-3xl">
          {isReviewMode && (
            <div className="mb-3 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Modo Revisión
              </span>
            </div>
          )}
          <Stepper
            steps={steps}
            currentStep={currentStep}
            clickable={isReviewMode}
            onStepClick={isReviewMode ? (stepIndex) => setCurrentStep(stepIndex) : undefined}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center pb-20 pt-4 p-4">
        {currentStep === 0 && (
          <div className="flex flex-col items-center justify-center w-full bg-white">
            <AntecedentesMedicos
              edad={finalPacienteData.edad}
              sexo={finalPacienteData.sexo}
              ocupacion={finalPacienteData.ocupacion}
              motivoConsulta={finalPacienteData.motivoConsulta}
              contextoIngreso={finalPacienteData.contextoIngreso}
            />
            {!isReviewMode && (
              <div className="mt-6">
                <button
                  onClick={handleStartConsulta}
                  className="bg-[#1098f7] hover:bg-[#0d7fd6] text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <FaStethoscope className="w-4 h-4" />
                  Comenzar Consulta
                </button>
              </div>
            )}
            {isReviewMode && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 italic">
                  En modo revisión puedes navegar entre los pasos usando el stepper superior
                </p>
              </div>
            )}
          </div>
        )}
        
        {currentStep === 1 && (
          <div className="w-[90vw] flex gap-6 h-[calc(100vh-270px)] mt-4">
            <div className="w-[30%] flex-shrink-0 flex flex-col gap-3">
              <div className="bg-white rounded-lg shadow-lg border-[0.5px] border-[#1098f7] flex-1 flex items-center justify-center relative">
                {showExamViewer && examImageUrl ? (
                  <>
                    <ChatImage
                      imageType={examImageUrl}
                      imageBasePath=""
                      step={1}
                      infoText={requestedExams.length > 0 && requestedExams[currentExamIndex]
                        ? getExamLabel(requestedExams[currentExamIndex])
                        : "Examen médico"}
                      enableZoom={true}
                    />
                    <button
                      onClick={() => setShowExamViewer(false)}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-md"
                    >
                      ✕ Cerrar
                    </button>
                  </>
                ) : (
                  <ChatImage
                    step={1}
                    loading={loading}
                    lastMessageRole={messages.length > 0 && (messages[messages.length - 1].role === "user" || messages[messages.length - 1].role === "assistant")
                      ? (messages[messages.length - 1].role as "user" | "assistant")
                      : undefined}
                    lastMessageContent={
                      messages.length > 0 && messages[messages.length - 1].role === "assistant"
                        ? messages[messages.length - 1].content
                        : undefined
                    }
                    infoText={`${finalPacienteData.nombre}, ${finalPacienteData.edad} años`}
                    sexo={finalClinicalCase.paciente.sexo}
                  />
                )}
              </div>

              {/* Button to reopen exam viewer when closed */}
              {!showExamViewer && requestedExams.length > 0 && (
                <button
                  onClick={() => setShowExamViewer(true)}
                  className="bg-[#1098f7] hover:bg-[#0d7fd6] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
                >
                  Ver Exámenes ({requestedExams.length})
                </button>
              )}

              {/* Exam Navigation */}
              {showExamViewer && requestedExams.length > 1 && (
                <div className="bg-white rounded-lg shadow-lg border-[0.5px] border-[#1098f7] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={handlePreviousExam}
                      disabled={currentExamIndex === 0}
                      className="px-3 py-1.5 bg-[#1098f7] text-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#0d7fd6] transition-colors text-sm font-medium"
                    >
                      ← Anterior
                    </button>
                    <span className="text-xs text-gray-600 font-medium">
                      Examen {currentExamIndex + 1} de {requestedExams.length}
                    </span>
                    <button
                      onClick={handleNextExam}
                      disabled={currentExamIndex === requestedExams.length - 1}
                      className="px-3 py-1.5 bg-[#1098f7] text-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#0d7fd6] transition-colors text-sm font-medium"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="w-[70%]">
              <Consulta
                clinicalCase={finalClinicalCase}
                messages={messages}
                loading={loading}
                input={input}
                onInputChange={setInput}
                onSend={isReviewMode ? undefined : handleSend}
                loadingInput={loading}
                requestedExams={requestedExams}
                disabled={isReviewMode}
              />
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="w-full max-w-5xl">
            <Feedback clinicalCase={finalClinicalCase} feedback={feedbackData} />
          </div>
        )}
      </div>

      {/* Stepper fixed en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 py-4 px-4">
        <div className="max-w-2xl mx-auto">
          {isReviewMode && (
            <div className="mb-3 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Modo Revisión
              </span>
            </div>
          )}
          <Stepper 
            steps={steps} 
            currentStep={currentStep} 
            clickable={isReviewMode}
            onStepClick={isReviewMode ? (stepIndex) => setCurrentStep(stepIndex) : undefined}
          />
        </div>
      </div>

      {/* Modal de Plan de Manejo - Renderizado en un portal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <ManagementPlanModal
          isOpen={showManagementModal}
          onClose={() => setShowManagementModal(false)}
          onSubmit={handleSubmitManagementPlan}
          isAPS={clinicalCase?.especialidad === "aps"}
          initialDiagnosis={detectedDiagnosis}
        />,
        document.body
      )}
    </div>
  );
}

export default function AnamnesisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando...</div>}>
      <AnamnesisPageContent />
    </Suspense>
  );
}
