export interface ClinicalCase {
  id: string;
  especialidad: "aps" | "urgencia" | "hospitalizacion" | "otro";
  aps_subcategoria?:
    | "cardiovascular"
    | "respiratorio"
    | "metabolico"
    | "salud_mental"
    | "musculoesqueletico"
    | "general";
  nivel_dificultad: "facil" | "medio" | "dificil";
  paciente: {
    edad: number;
    sexo: "masculino" | "femenino" | "otro";
    ocupacion: string;
    contexto_ingreso: string;
  };
  motivo_consulta: string;
  sintomas: {
    descripcion_general: string;
    detalle: string[];
  };
  antecedentes: {
    personales: string[];
    familiares: string[];
    farmacos: string[];
    alergias: string[];
  };
  examen_fisico: {
    signos_vitales: {
      temperatura: number;
      frecuencia_cardiaca: number;
      presion_arterial: string;
      frecuencia_respiratoria: number;
      saturacion_o2: number;
    };
    hallazgos_relevantes: string[];
  };
  examenes: Record<
    string,
    {
      realizado: boolean;
      resultado?: string;
    }
  >;
  diagnostico_principal: string;
  diagnosticos_diferenciales: string[];
  info_oculta: string[];
  info_prohibida: string[];
  // Campos específicos para casos de APS
  manejo_aps?: {
    criterio_ingreso_programa: {
      aplica: boolean;
      programa?: string; // Abierto: PSCV, ERA, Salud Mental, PNI, PIE Adulto Mayor, etc.
      justificacion?: string;
    };
    metas_terapeuticas?: string[];
    manejo_inicial: string[];
    tiempos_legales_y_oportunidad?: {
      es_ges: boolean;
      tiempos_requeridos?: string[];
    };
    derivacion: {
      requiere_derivacion: boolean;
      tipo_derivacion?:
        | "ambulatoria_especialista"
        | "urgencia"
        | "hospitalizacion"
        | "no_requiere";
      criterios: string[];
      red_flags: string[];
    };
    seguimiento: {
      frecuencia: string;
      duracion?: string;
      educacion_obligatoria: string[];
    };
    factores_psicosociales_modificadores?: string[];
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

// Plan de manejo del estudiante (lo que el estudiante propuso)
export interface StudentManagementPlan {
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

export interface FeedbackResult {
  puntajes: {
    anamnesis_motivo_consulta: number;
    identificacion_sintomas: number;
    antecedentes: number;
    razonamiento_clinico: number;
    comunicacion_empatia: number;
    // Para casos APS
    manejo_derivacion?: number;
  };
  comentarios: {
    fortalezas: string[];
    debilidades: string[];
    sugerencias: string[];
  };
  diagnostico: {
    estudiante: string;
    correcto: boolean;
    diagnostico_real: string;
    comentario: string;
  };
  // Para casos APS
  manejo?: {
    derivacion_correcta: boolean;
    tipo_derivacion_adecuado: boolean;
    manejo_inicial_apropiado: boolean;
    considero_ingreso_programa?: boolean;
    metas_terapeuticas_definidas?: boolean;
    educacion_y_seguimiento_apropiados?: boolean;
    considero_factores_psicosociales?: boolean;
    comentario: string;
    recomendaciones_especificas?: {
      derivacion: string;
      programa_aps: string;
      metas_terapeuticas: string[];
      manejo_cesfam: string[];
      educacion_paciente: string[];
      seguimiento: string;
    };
  };
}

export interface PatientContext {
  clinicalCase: ClinicalCase;
  personalityTraits?: string[];
}

export type SimulationStatus = "active" | "completed" | "abandoned";

export interface Simulation {
  id: string;
  clinicalCase: ClinicalCase;
  patientContext: PatientContext;
  chatHistory: ChatMessage[];
  status: SimulationStatus;
  createdAt: Date;
  updatedAt: Date;
}
