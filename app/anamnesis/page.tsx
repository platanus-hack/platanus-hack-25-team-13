"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaStethoscope } from "react-icons/fa";
import type { ClinicalCase, ChatMessage } from "@/types/case";
import AntecedentesMedicos from "../../components/anamnesis/AntecedentesMedicos";
import Consulta from "../../components/anamnesis/Consulta";
import Diagnostico from "../../components/anamnesis/Diagnostico";
import Feedback from "../../components/anamnesis/Feedback";
import ChatInput from "../../components/anamnesis/ChatInput";
import ChatAvatar from "../../components/anamnesis/ChatAvatar";
import Stepper from "../../components/Stepper";

export default function AnamnesisPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pacienteData, setPacienteData] = useState<any>(null);
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase | null>(null);

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
    { title: "Consulta" },
    { title: "Diagnóstico" },
    { title: "Finalizar" },
  ];

  const handleStartConsulta = () => {
    setCurrentStep(1);
    setMessages([]);
    setTimeout(() => {
      setMessages([
        {
          role: "assistant",
          content: finalClinicalCase.motivo_consulta 
            ? `Hola doctor/a, ${finalClinicalCase.motivo_consulta}`
            : "Hola doctor/a, ¿en qué puedo ayudarle?",
          timestamp: new Date(),
        },
      ]);
    }, 2000);
  };

  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     (window as unknown).__DEV_NEXT_STEP = handleNextStep;
  //   }
  //   return () => {
  //     if (typeof window !== 'undefined') {
  //       delete (window as unknown).__DEV_NEXT_STEP;
  //     }
  //   };
  // }, [currentStep]);

  async function handleSend() {
    // Esta página es solo una demostración con datos de ejemplo.
    // Para usar el sistema completo con engine inteligente, usa /simulador
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulación simple para demo (sin engine)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "Esta es una página de demostración. Para usar el sistema completo con engine inteligente, por favor usa la página /simulador que incluye el sistema de simulación con RAG y feedback automático.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff] flex flex-col">
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center py-3 px-4 bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff] border-t border-gray-200">
        <div className="w-full max-w-3xl">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center pb-20 pt-4 p-4">
        {currentStep === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] mt-4">
            <AntecedentesMedicos
              nombre={finalPacienteData.nombre}
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
          <div className="w-[90vw] flex gap-6 h-[calc(100vh-200px)] mt-20">
            <div className="w-[30%] flex-shrink-0">
              <div className="bg-white rounded-lg shadow-lg border-[0.5px] border-[#1098f7] h-full flex items-center justify-center">
                <ChatAvatar 
                  step={currentStep} 
                  loading={loading}
                  lastMessageRole={messages.length > 0 && (messages[messages.length - 1].role === "user" || messages[messages.length - 1].role === "assistant") 
                    ? (messages[messages.length - 1].role as "user" | "assistant")
                    : undefined}
                />
              </div>
            </div>
            <div className="w-[70%]">
              <Consulta clinicalCase={finalClinicalCase} messages={messages} loading={loading} input={input} onInputChange={setInput} onSend={handleSend} loadingInput={loading} />
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="w-[90vw] flex gap-6 h-[calc(100vh-200px)] mt-4">
            <div className="w-[30%] flex-shrink-0">
              <div className="bg-white rounded-lg shadow-lg border-[0.5px] border-[#1098f7] h-full flex items-center justify-center">
                <ChatAvatar 
                  step={currentStep} 
                  loading={loading}
                  expression="diagnostico"
                  lastMessageRole={messages.length > 0 && (messages[messages.length - 1].role === "user" || messages[messages.length - 1].role === "assistant") 
                    ? messages[messages.length - 1].role as "user" | "assistant"
                    : undefined}
                />
              </div>
            </div>
            <div className="w-[70%]">
              <Diagnostico clinicalCase={finalClinicalCase} messages={messages} loading={loading} input={input} onInputChange={setInput} onSend={handleSend} loadingInput={loading} />
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="w-full max-w-5xl">
            <Feedback clinicalCase={finalClinicalCase} />
          </div>
        )}
      </div>
    </div>
  );
}

