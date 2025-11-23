import { FaUser, FaCalendar, FaUserMd, FaBriefcase, FaClipboardList, FaHospital } from "react-icons/fa";

interface AntecedentesMedicosProps {
  edad: number;
  sexo: string;
  ocupacion: string;
  motivoConsulta: string;
  contextoIngreso: string;
}

export default function AntecedentesMedicos({
  edad,
  sexo,
  ocupacion,
  motivoConsulta,
  contextoIngreso,
}: AntecedentesMedicosProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-[#001c55] mb-1">
          Información del Paciente
        </h1>
        <p className="text-sm text-gray-600">
          Revisa los antecedentes antes de comenzar la consulta
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Patient Icon Header */}
        <div className="bg-[#1098f7] p-3 flex items-center justify-center">
          <div className="bg-white rounded-full p-2 shadow-md">
            <FaUser className="w-8 h-8 text-[#1098f7]" />
          </div>
        </div>

        {/* Patient Info Grid */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Edad */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="bg-[#1098f7] p-2 rounded">
                <FaCalendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Edad</p>
                <p className="text-sm font-bold text-[#001c55]">{edad} años</p>
              </div>
            </div>

            {/* Sexo */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="bg-[#1098f7] p-2 rounded">
                <FaUserMd className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Sexo</p>
                <p className="text-sm font-bold text-[#001c55]">{sexo}</p>
              </div>
            </div>

            {/* Ocupación */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="bg-[#1098f7] p-2 rounded">
                <FaBriefcase className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Ocupación</p>
                <p className="text-sm font-bold text-[#001c55]">{ocupacion}</p>
              </div>
            </div>
          </div>

          {/* Motivo de Consulta */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <FaClipboardList className="w-4 h-4 text-[#1098f7]" />
              <h3 className="text-sm font-bold text-[#001c55]">Motivo de Consulta</h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-[#1098f7]">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {motivoConsulta}
              </p>
            </div>
          </div>

          {/* Contexto del Ingreso */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FaHospital className="w-4 h-4 text-[#1098f7]" />
              <h3 className="text-sm font-bold text-[#001c55]">Contexto del Ingreso</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-300">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {contextoIngreso}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

