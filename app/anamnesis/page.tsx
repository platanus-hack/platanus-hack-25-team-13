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

  // Datos de ejemplo del paciente
  const pacienteData = {
    nombre: "María González",
    edad: 45,
    sexo: "Femenino",
    ocupacion: "Profesora",
    motivoConsulta: "Paciente de 45 años que acude a consulta por dolor torácico de inicio súbito hace 2 horas, acompañado de disnea y sudoración. Refiere antecedente de hipertensión arterial en tratamiento.",
    antecedentesPersonales: "Hipertensión arterial desde hace 5 años. Diabetes tipo 2 diagnosticada hace 3 años. No fumadora. Sedentaria.",
    contextoIngreso: "Paciente llega al servicio de urgencias en ambulancia tras presentar dolor torácico intenso. Se encuentra hemodinámicamente estable al ingreso. Se realiza ECG que muestra elevación del segmento ST en derivaciones anteroseptales.",
    medicamentosYAlergias: "Metformina 850mg cada 12 horas. Losartán 50mg diario. No alergias conocidas a medicamentos."
  };

  // Caso clínico de ejemplo basado en los datos del paciente
  const clinicalCase: ClinicalCase = {
    id: "1",
    especialidad: "urgencia",
    nivel_dificultad: "medio",
    paciente: {
      edad: pacienteData.edad,
      sexo: pacienteData.sexo.toLowerCase() as "masculino" | "femenino" | "otro",
      ocupacion: pacienteData.ocupacion,
      contexto_ingreso: pacienteData.contextoIngreso,
    },
    motivo_consulta: pacienteData.motivoConsulta,
    sintomas: {
      descripcion_general: "Dolor torácico de inicio súbito",
      detalle: ["Dolor torácico", "Disnea", "Sudoración"],
    },
    antecedentes: {
      personales: pacienteData.antecedentesPersonales.split(". "),
      familiares: [],
      farmacos: pacienteData.medicamentosYAlergias.split(". "),
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
          content: `Hola doctor/a, ${clinicalCase.motivo_consulta}`,
          timestamp: new Date(),
        },
      ]);
    }, 2000);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      setMessages([]);
      setTimeout(() => {
        setMessages([
          {
            role: "assistant",
            content: "Según lo hablado durante la consulta, necesito que proporciones tu diagnóstico. Por favor, indica cuál es diagnóstico principal y explica las razones que te llevaron a esta conclusión.",
            timestamp: new Date(),
          },
        ]);
      }, 2000);
    } else if (currentStep === 2) {
      setCurrentStep(3);
      setMessages([]);
      setTimeout(() => {
        setMessages([
          {
            role: "assistant",
            content: "Ahora recibirás el feedback sobre tu diagnóstico y el proceso de consulta realizado.",
            timestamp: new Date(),
          },
        ]);
      }, 2000);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__DEV_NEXT_STEP = handleNextStep;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__DEV_NEXT_STEP;
      }
    };
  }, [currentStep]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          clinicalCase,
        }),
      });

      if (!res.ok) throw new Error("Error en chat");

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      alert("Error enviando mensaje");
    } finally {
      setLoading(false);
    }
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
              nombre={pacienteData.nombre}
              edad={pacienteData.edad}
              sexo={pacienteData.sexo}
              ocupacion={pacienteData.ocupacion}
              motivoConsulta={pacienteData.motivoConsulta}
              antecedentesPersonales={pacienteData.antecedentesPersonales}
              contextoIngreso={pacienteData.contextoIngreso}
              medicamentosYAlergias={pacienteData.medicamentosYAlergias}
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
              <Consulta clinicalCase={clinicalCase} messages={messages} loading={loading} input={input} onInputChange={setInput} onSend={handleSend} loadingInput={loading} />
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
              <Diagnostico clinicalCase={clinicalCase} messages={messages} loading={loading} input={input} onInputChange={setInput} onSend={handleSend} loadingInput={loading} />
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="w-full max-w-5xl">
            <Feedback clinicalCase={clinicalCase} />
          </div>
        )}
      </div>
    </div>
  );
}

