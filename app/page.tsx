"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaStethoscope, FaClock, FaCheckCircle, FaTimesCircle, FaUser, FaArrowRight } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from "recharts";
import LoadingScreen from "./components/utils/LoadingScreen";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartSimulation = () => {
    setIsLoading(true);
    // Después de 3 segundos, navegar a antecedentes médicos
    setTimeout(() => {
      router.push("/antecedentes-medicos");
    }, 3000);
  };

  // Función para convertir porcentaje a nota chilena (1-7)
  const convertirANota = (porcentaje: number): number => {
    // Escala: 0% = 1.0, 100% = 7.0
    return Math.round(((porcentaje / 100) * 6 + 1) * 10) / 10;
  };

  // Datos de ejemplo para el historial
  const historialSimulaciones = [
    {
      id: 1,
      fecha: "22 Nov 2025",
      caso: "Caso Clínico: Hipertensión Arterial",
      duracion: "15 min",
      resultado: "correcto",
      puntuacion: 85,
      nota: convertirANota(85),
    },
    {
      id: 2,
      fecha: "21 Nov 2025",
      caso: "Caso Clínico: Diabetes Tipo 2",
      duracion: "20 min",
      resultado: "correcto",
      puntuacion: 92,
      nota: convertirANota(92),
    },
    {
      id: 3,
      fecha: "20 Nov 2025",
      caso: "Caso Clínico: Neumonía",
      duracion: "18 min",
      resultado: "incorrecto",
      puntuacion: 65,
      nota: convertirANota(65),
    },
    {
      id: 4,
      fecha: "19 Nov 2025",
      caso: "Caso Clínico: Asma",
      duracion: "12 min",
      resultado: "correcto",
      puntuacion: 88,
      nota: convertirANota(88),
    },
  ];

  // Datos para el gráfico de desempeño (últimos 7 días) - en notas 1-7
  const datosDesempeno = [
    { dia: "Lun", valor: convertirANota(75) },
    { dia: "Mar", valor: convertirANota(82) },
    { dia: "Mié", valor: convertirANota(68) },
    { dia: "Jue", valor: convertirANota(90) },
    { dia: "Vie", valor: convertirANota(85) },
    { dia: "Sáb", valor: convertirANota(88) },
    { dia: "Dom", valor: convertirANota(92) },
  ];

  const maxValor = 7; // Máximo de la escala chilena

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className="h-[85vh] bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff] font-sans overflow-hidden flex flex-col">
      <main className="flex-1 overflow-hidden min-h-0">
        <div className="h-full max-w-7xl mx-auto px-2 py-1.5 flex flex-col">
          {/* Saludo de Bienvenida */}
          <div className="mb-1.5 flex-shrink-0">
            <h1 className="text-xl font-bold text-[#001c55]">
              ¡Bienvenido de vuelta! 👋
          </h1>
          </div>

          {/* Grid 2x2 */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 min-h-0">
            {/* Fila 1 - Columna 1: Botón Iniciar Simulación */}
            <button
              onClick={handleStartSimulation}
              className="bg-gradient-to-br from-[#1098f7] to-[#0d7fd6] rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] hover:from-[#0e85e0] hover:to-[#0c7cc5] transition-all duration-300 flex flex-col items-center justify-center gap-2 p-3 group min-h-0 active:scale-[0.98]"
            >
              <FaStethoscope className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
              <div className="text-center">
                <h2 className="text-lg font-bold text-white group-hover:scale-[1.02] transition-transform duration-300">
                  Iniciar Simulación
                </h2>
              </div>
            </button>

            {/* Fila 1 - Columna 2: Perfil de Usuario */}
            <div className="bg-white rounded-lg shadow-md border-[0.5px] border-[#1098f7] border-opacity-20 flex flex-col overflow-hidden min-h-0">
              <div className="p-2 border-b-[0.5px] border-[#1098f7] border-opacity-20 flex-shrink-0">
                <h3 className="text-base font-bold text-[#001c55]">
                  Perfil de Usuario
                </h3>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 p-2 min-h-0 overflow-hidden">
                <div className="flex-shrink-0">
                  <h4 className="text-lg font-bold text-[#001c55] mb-0.5">
                    Juan Pérez
                  </h4>
                  <p className="text-sm text-[#001c55] text-opacity-70 mb-0.5">
                    Estudiante de medicina
                  </p>
                  <p className="text-sm text-[#001c55] text-opacity-70">
                    Especialidad: Cardiología
          </p>
        </div>
                <div className="grid grid-cols-2 gap-1.5 flex-shrink-0">
                  <div className="p-1 bg-[#f0f8ff] rounded">
                    <div className="text-xs text-[#001c55] text-opacity-60 mb-0.5">
                      Promedio
                    </div>
                    <div className="text-base font-bold text-[#1098f7]">
                      {(
                        historialSimulaciones.reduce(
                          (acc, s) => acc + s.nota,
                          0
                        ) / historialSimulaciones.length
                      ).toFixed(1)}
                    </div>
                  </div>
                  <div className="p-1 bg-[#f0f8ff] rounded">
                    <div className="text-xs text-[#001c55] text-opacity-60 mb-0.5">
                      Racha semanal
                    </div>
                    <div className="text-base font-bold text-[#1098f7]">
                      5
                    </div>
                  </div>
                </div>
                <div className="p-1 bg-[#f0f8ff] rounded flex-shrink-0">
                  <div className="text-xs text-[#001c55] text-opacity-60 mb-0.5">
                    Categoría favorita
                  </div>
                  <div className="text-sm font-bold text-[#1098f7]">
                    Cardiología
                  </div>
                </div>
                <div className="p-1 bg-[#f0f8ff] rounded flex-shrink-0">
                  <div className="text-xs text-[#001c55] text-opacity-70">
                    Última simulación hecha en el día
                  </div>
                  <div className="text-sm font-bold text-[#1098f7] mt-0.5">
                    {historialSimulaciones.length > 0 ? historialSimulaciones[0].fecha : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Fila 2 - Columna 1: Gráfico de Desempeño */}
            <div className="bg-white rounded-lg shadow-md border-[0.5px] border-[#1098f7] border-opacity-20 flex flex-col overflow-hidden min-h-0">
              <div className="p-2 border-b-[0.5px] border-[#1098f7] border-opacity-20 flex-shrink-0">
                <h3 className="text-base font-bold text-[#001c55]">
                  Desempeño Semanal
                </h3>
              </div>
              <div className="flex-1 flex flex-col justify-between p-2 min-h-0">
                {/* Gráfico de líneas con recharts */}
                <div className="flex-1 mb-2 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosDesempeno}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="dia" 
                        tick={{ fontSize: 11, fill: "#001c55" }}
                        stroke="#1098f7"
                      />
                      <YAxis 
                        domain={[1, 7]}
                        tick={{ fontSize: 11, fill: "#001c55" }}
                        stroke="#1098f7"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          border: "1px solid #1098f7",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                        formatter={(value: number) => value.toFixed(1)}
                      />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        stroke="#1098f7"
                        strokeWidth={2}
                        dot={{ fill: "#1098f7", r: 4, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Estadísticas resumidas */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t-[0.5px] border-[#1098f7] border-opacity-20 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-lg font-bold text-[#1098f7]">
                      {historialSimulaciones.length}
                    </div>
                    <div className="text-xs text-[#001c55] text-opacity-60">
                      Simulaciones
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[#1098f7]">
                      {(
                        historialSimulaciones.reduce(
                          (acc, s) => acc + s.nota,
                          0
                        ) / historialSimulaciones.length
                      ).toFixed(1)}
                    </div>
                    <div className="text-xs text-[#001c55] text-opacity-60">
                      Promedio
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[#1098f7]">
                      {
                        historialSimulaciones.filter(
                          (s) => s.resultado === "correcto"
                        ).length
                      }
                    </div>
                    <div className="text-xs text-[#001c55] text-opacity-60">
                      Correctos
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fila 2 - Columna 2: Últimos Casos Clínicos */}
            <div className="bg-white rounded-lg shadow-md border-[0.5px] border-[#1098f7] border-opacity-20 flex flex-col overflow-hidden min-h-0">
              <div className="p-2 border-b-[0.5px] border-[#1098f7] border-opacity-20 flex-shrink-0">
                <h3 className="text-xl font-bold text-[#001c55]">
                  Últimos Casos Clínicos
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 min-h-0">
                {historialSimulaciones.map((simulacion) => (
                  <div
                    key={simulacion.id}
                    className="p-1.5 bg-[#f0f8ff] rounded border-[0.5px] border-[#1098f7] border-opacity-20 hover:border-opacity-40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {simulacion.resultado === "correcto" ? (
                          <FaCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <FaTimesCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-[#001c55] text-sm truncate">
                          {simulacion.caso}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-[#1098f7]">
                          {simulacion.nota.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-[#001c55] text-opacity-60">
                        <span className="flex items-center gap-0.5">
                          <FaClock className="w-2 h-2" />
                          {simulacion.duracion}
                        </span>
                        <span>{simulacion.fecha}</span>
                      </div>
                      <button
                        onClick={() => {
                          // Aquí puedes agregar la lógica para revisar el caso
                          router.push(`/antecedentes-medicos?id=${simulacion.id}`);
                        }}
                        className="flex items-center gap-1 text-[#1098f7] hover:text-[#0d7fd6] text-[10px] font-medium hover:underline transition-all duration-200"
                      >
                        Revisar
                        <FaArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
