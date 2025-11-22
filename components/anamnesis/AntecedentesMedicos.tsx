import { FaUser } from "react-icons/fa";

interface AntecedentesMedicosProps {
  nombre: string;
  edad: number;
  sexo: string;
  ocupacion: string;
  motivoConsulta: string;
  antecedentesPersonales: string;
  contextoIngreso: string;
  medicamentosYAlergias: string;
}

export default function AntecedentesMedicos({
  nombre,
  edad,
  sexo,
  ocupacion,
  motivoConsulta,
  antecedentesPersonales,
  contextoIngreso,
  medicamentosYAlergias,
}: AntecedentesMedicosProps) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-[#ffffff] rounded-lg shadow-lg border-[0.5px] border-[#1098f7] p-4">
      <h2 className="text-xl font-bold text-[#00072d] mb-4 pb-3 border-b-[0.5px] border-[#1098f7]">
        Antecedentes Médicos
      </h2>

      <div className="flex gap-2 mb-4 items-center">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#001c55] uppercase tracking-wide">
              Nombre completo
            </label>
            <p className="text-sm text-[#00072d]">{nombre}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#001c55] uppercase tracking-wide">
              Edad
            </label>
            <p className="text-sm text-[#00072d]">{edad} años</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#001c55] uppercase tracking-wide">
              Sexo
            </label>
            <p className="text-sm text-[#00072d]">{sexo}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#001c55] uppercase tracking-wide">
              Ocupación
            </label>
            <p className="text-sm text-[#00072d]">{ocupacion}</p>
          </div>
        </div>
        <div className="flex items-center justify-center flex-shrink-0">
          <FaUser className="w-16 h-16 text-[#1098f7]" />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#001c55] uppercase tracking-wide block">
            Motivo de consulta
          </label>
          <p className="text-sm text-[#00072d] leading-relaxed whitespace-pre-line">
            {motivoConsulta}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#001c55] uppercase tracking-wide block">
            Antecedentes personales
          </label>
          <p className="text-sm text-[#00072d] leading-relaxed whitespace-pre-line">
            {antecedentesPersonales}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#001c55] uppercase tracking-wide block">
            Contexto del ingreso
          </label>
          <p className="text-sm text-[#00072d] leading-relaxed whitespace-pre-line">
            {contextoIngreso}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#001c55] uppercase tracking-wide block">
            Medicamentos y alergias
          </label>
          <p className="text-sm text-[#00072d] leading-relaxed whitespace-pre-line">
            {medicamentosYAlergias}
          </p>
        </div>
      </div>
    </div>
  );
}

