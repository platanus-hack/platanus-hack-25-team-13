"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AntecedentesMedicos from "../components/medical-history/AntecedentesMedicos";

export default function AntecedentesMedicosPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

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

  const steps = [
    { title: "Antecedentes" },
    { title: "Consulta" },
    { title: "Diagnóstico" },
    { title: "Finalizar" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-start pt-8 p-4">
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
            onClick={() => {
              // Aquí puedes agregar la lógica para continuar con la consulta
              router.push("/simulador");
            }}
            className="bg-[#1098f7] hover:bg-[#0d7fd6] text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Comenzar Consulta
          </button>
        </div>
        
        {/* Stepper personalizado */}
        <div className="mt-20 w-full max-w-2xl">
          <div className="flex items-start">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start flex-1 relative">
                <div className="flex flex-col items-center w-full">
                  <div
                    className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-300 z-10 ${
                      index < currentStep
                        ? "bg-[#1098f7] text-white"
                        : index === currentStep
                        ? "bg-[#1098f7] text-white ring-1 ring-[#1098f7] ring-offset-1"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index < currentStep ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 text-center font-medium transition-colors duration-300 ${
                      index <= currentStep
                        ? "text-[#1098f7]"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-1/2 top-3 h-0.5 w-full transition-colors duration-300 ${
                      index < currentStep
                        ? "bg-[#1098f7]"
                        : "bg-gray-200"
                    }`}
                    style={{ marginLeft: '0.75rem' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

