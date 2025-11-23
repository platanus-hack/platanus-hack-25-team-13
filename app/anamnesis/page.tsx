"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
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
import { supabase } from "@/lib/supabase";

export default function AnamnesisPage() {
  const router = useRouter();
  const { user } = useAuth();
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

  // Set mounted to true when component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar datos del caso generado desde home
  useEffect(() => {
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

  const handleStartConsulta = () => {
    setCurrentStep(1);
    setMessages([]);
    setTimeout(() => {
      const firstMessage = initialMessage || 
        (finalClinicalCase.motivo_consulta 
          ? finalClinicalCase.motivo_consulta
          : "Hola");
      
      setMessages([
        {
          role: "assistant",
          content: firstMessage,
          timestamp: new Date(),
        },
      ]);
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
    <div className="bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff] flex flex-col">
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center py-3 px-4 bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff] border-t border-gray-200">
        <div className="w-full max-w-3xl">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center pb-20 pt-4 p-4">
        {currentStep === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] mt-4">
            <AntecedentesMedicos
              edad={finalPacienteData.edad}
              sexo={finalPacienteData.sexo}
              ocupacion={finalPacienteData.ocupacion}
              motivoConsulta={finalPacienteData.motivoConsulta}
              contextoIngreso={finalPacienteData.contextoIngreso}
            />
            <div className="mt-6">
              <button
                onClick={handleStartConsulta}
                className="bg-[#1098f7] hover:bg-[#0d7fd6] text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <FaStethoscope className="w-4 h-4" />
                Comenzar Consulta
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 1 && (
          <div className="w-[90vw] flex gap-6 h-[calc(100vh-200px)] ">
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
                onSend={handleSend}
                loadingInput={loading}
                requestedExams={requestedExams}
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


