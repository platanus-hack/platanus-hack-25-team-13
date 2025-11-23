"use client";

import { useState, useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";

export interface ManagementPlanData {
  requiere_derivacion: boolean;
  tipo_derivacion: "no_requiere" | "ambulatoria_especialista" | "urgencia" | "hospitalizacion";
  especialidad_derivacion?: string;
  ingresa_programa_aps: boolean;
  programa_aps?: string;
  manejo_inicial_cesfam: string;
  metas_terapeuticas: string;
  plan_seguimiento: string;
  diagnostico: string;
}

interface ManagementPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManagementPlanData) => void;
  isAPS: boolean;
  initialDiagnosis?: string;
}

const PROGRAMAS_APS = [
  "No aplica",
  "PSCV",
  "ERA",
  "Salud Mental",
  "PNI",
  "PIE Adulto Mayor",
  "PNAC",
  "Programa de Salud de la Mujer",
  "Programa del Adolescente",
  "Otro programa APS",
];

export default function ManagementPlanModal({
  isOpen,
  onClose,
  onSubmit,
  isAPS,
  initialDiagnosis = "",
}: ManagementPlanModalProps) {
  const [formData, setFormData] = useState<ManagementPlanData>({
    requiere_derivacion: false,
    tipo_derivacion: "no_requiere",
    especialidad_derivacion: "",
    ingresa_programa_aps: false,
    programa_aps: "",
    manejo_inicial_cesfam: "",
    metas_terapeuticas: "",
    plan_seguimiento: "",
    diagnostico: initialDiagnosis,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update diagnosis when initialDiagnosis changes
  useEffect(() => {
    if (initialDiagnosis) {
      setFormData(prev => ({ ...prev, diagnostico: initialDiagnosis }));
    }
  }, [initialDiagnosis]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    const newErrors: Record<string, string> = {};
    
    if (!formData.diagnostico.trim()) {
      newErrors.diagnostico = "El diagnóstico es obligatorio";
    }
    
    if (isAPS) {
      if (formData.requiere_derivacion && formData.tipo_derivacion === "no_requiere") {
        newErrors.tipo_derivacion = "Debes especificar el tipo de derivación";
      }

      if (formData.requiere_derivacion &&
          formData.tipo_derivacion === "ambulatoria_especialista" &&
          !formData.especialidad_derivacion?.trim()) {
        newErrors.especialidad_derivacion = "Especifica la especialidad";
      }

      if (formData.ingresa_programa_aps && !formData.programa_aps?.trim()) {
        newErrors.programa_aps = "Debes seleccionar un programa";
      }

      if (!formData.manejo_inicial_cesfam.trim()) {
        newErrors.manejo_inicial_cesfam = "Describe el manejo inicial en CESFAM";
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(formData);
  };

  const handleChange = (field: keyof ManagementPlanData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-[#1098f7] to-[#0d7fd6] text-white p-6 rounded-t-xl flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold">Plan de Manejo y Diagnóstico</h2>
            <p className="text-sm text-blue-100 mt-1">
              {isAPS 
                ? "Completa tu plan de manejo para este caso de APS y entrega tu diagnóstico"
                : "Entrega tu diagnóstico y plan de manejo para este caso"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Sección APS */}
          {isAPS && (
            <>
              {/* Derivación */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3 text-lg">Decisión de Derivación</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requiere_derivacion"
                      checked={formData.requiere_derivacion}
                      onChange={(e) => {
                        handleChange("requiere_derivacion", e.target.checked);
                        if (!e.target.checked) {
                          handleChange("tipo_derivacion", "no_requiere");
                          handleChange("especialidad_derivacion", "");
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="requiere_derivacion" className="font-semibold text-gray-700">
                      Este paciente requiere derivación
                    </label>
                  </div>

                  {formData.requiere_derivacion && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tipo de derivación *
                        </label>
                        <select
                          value={formData.tipo_derivacion}
                          onChange={(e) => handleChange("tipo_derivacion", e.target.value)}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            errors.tipo_derivacion ? "border-red-500" : "border-gray-300"
                          }`}
                        >
                          <option value="no_requiere">No requiere</option>
                          <option value="ambulatoria_especialista">Derivación ambulatoria a especialista</option>
                          <option value="urgencia">Derivación urgente a servicio de urgencia</option>
                          <option value="hospitalizacion">Derivación para hospitalización</option>
                        </select>
                        {errors.tipo_derivacion && (
                          <p className="text-red-500 text-xs mt-1">{errors.tipo_derivacion}</p>
                        )}
                      </div>

                      {formData.tipo_derivacion === "ambulatoria_especialista" && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Especialidad a derivar *
                          </label>
                          <input
                            type="text"
                            value={formData.especialidad_derivacion || ""}
                            onChange={(e) => handleChange("especialidad_derivacion", e.target.value)}
                            placeholder="Ej: Cardiología, Endocrinología, Psiquiatría..."
                            className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                              errors.especialidad_derivacion ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {errors.especialidad_derivacion && (
                            <p className="text-red-500 text-xs mt-1">{errors.especialidad_derivacion}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Programa APS */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-green-900 mb-3 text-lg">Programa APS</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="ingresa_programa_aps"
                      checked={formData.ingresa_programa_aps}
                      onChange={(e) => {
                        handleChange("ingresa_programa_aps", e.target.checked);
                        if (!e.target.checked) {
                          handleChange("programa_aps", "");
                        }
                      }}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <label htmlFor="ingresa_programa_aps" className="font-semibold text-gray-700">
                      Ingresa a programa APS
                    </label>
                  </div>

                  {formData.ingresa_programa_aps && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ¿A qué programa? *
                      </label>
                      <select
                        value={formData.programa_aps || ""}
                        onChange={(e) => handleChange("programa_aps", e.target.value)}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none ${
                          errors.programa_aps ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="">Selecciona un programa...</option>
                        {PROGRAMAS_APS.map(prog => (
                          <option key={prog} value={prog}>{prog}</option>
                        ))}
                      </select>
                      {errors.programa_aps && (
                        <p className="text-red-500 text-xs mt-1">{errors.programa_aps}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Manejo Inicial */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manejo inicial en CESFAM *
                </label>
                <textarea
                  value={formData.manejo_inicial_cesfam}
                  onChange={(e) => handleChange("manejo_inicial_cesfam", e.target.value)}
                  placeholder="Describe las acciones terapéuticas, educativas y de monitoreo que realizarías en el CESFAM antes o en lugar de derivar..."
                  rows={4}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${
                    errors.manejo_inicial_cesfam ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.manejo_inicial_cesfam && (
                  <p className="text-red-500 text-xs mt-1">{errors.manejo_inicial_cesfam}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo: "Iniciar enalapril 10mg/día, educación en dieta DASH, control de PA en 7 días"
                </p>
              </div>

              {/* Metas Terapéuticas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Metas terapéuticas (opcional)
                </label>
                <textarea
                  value={formData.metas_terapeuticas}
                  onChange={(e) => handleChange("metas_terapeuticas", e.target.value)}
                  placeholder="Establece objetivos concretos y medibles..."
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo: "PA {'<'}140/90 mmHg, HbA1c {'<'}7%, IMC {'<'}25"
                </p>
              </div>

              {/* Seguimiento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Plan de seguimiento (opcional)
                </label>
                <textarea
                  value={formData.plan_seguimiento}
                  onChange={(e) => handleChange("plan_seguimiento", e.target.value)}
                  placeholder="Describe la frecuencia de controles, duración y educación..."
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo: "Control cada 2 semanas hasta alcanzar meta de PA, luego mensual. Educación en restricción de sal y ejercicio."
                </p>
              </div>
            </>
          )}

          {/* Diagnóstico (obligatorio para todos) */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <h3 className="font-bold text-purple-900 mb-3 text-lg">Diagnóstico *</h3>
            <textarea
              value={formData.diagnostico}
              onChange={(e) => handleChange("diagnostico", e.target.value)}
              placeholder="Escribe tu diagnóstico principal..."
              rows={3}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none ${
                errors.diagnostico ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.diagnostico && (
              <p className="text-red-500 text-xs mt-1">{errors.diagnostico}</p>
            )}
          </div>

          {/* Botón de envío */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="w-full max-w-md px-6 py-3 bg-gradient-to-r from-[#1098f7] to-[#0d7fd6] text-white rounded-lg hover:from-[#0d7fd6] hover:to-[#0a6bb5] transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <FaCheckCircle className="w-5 h-5" />
              Enviar y ver resultados
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
