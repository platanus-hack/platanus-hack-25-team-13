"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaStethoscope } from "react-icons/fa";
import type { ClinicalCase, ChatMessage } from "@/types/case";
import AntecedentesMedicos from "../../components/anamnesis/AntecedentesMedicos";
import Consulta from "../../components/anamnesis/Consulta";
import ChatInput from "../../components/anamnesis/ChatInput";
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
    setMessages([
      {
        role: "assistant",
        content: `Hola doctor/a, ${clinicalCase.motivo_consulta}`,
        timestamp: new Date(),
      },
    ]);
  };

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
      <div className="fixed top-20 left-0 right-0 z-10 flex justify-center pt-2 pb-2">
        <div className="w-full max-w-2xl px-4">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center pt-32 pb-4 p-4">
        {currentStep === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
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
          <div className="w-full max-w-4xl">
            <Consulta clinicalCase={clinicalCase} messages={messages} loading={loading} input={input} onInputChange={setInput} onSend={handleSend} loadingInput={loading} />
          </div>
        )}
      </div>
    </div>
  );
}

