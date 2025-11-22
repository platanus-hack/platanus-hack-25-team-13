export interface ClinicalCase {
  id: string;
  especialidad: "medicina_interna" | "urgencia" | "respiratorio" | "digestivo" | "aps" | "otro";
  nivel_dificultad: "facil" | "medio" | "dificil";
  paciente: {
    edad: number;
    sexo:  "masculino" | "femenino" | "otro";
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
  examenes: Record<string, {
    realizado: boolean;
    resultado?: string;
  }>;
  diagnostico_principal: string;
  diagnosticos_diferenciales: string[];
  info_oculta: string[];
  info_prohibida: string[];
  // Campos específicos para casos de APS
  manejo_aps?: {
    criterio_ingreso_programa: {
      aplica: boolean;
      programa?: "PSCV" | "ERA" | "Salud_Mental" | "No_aplica";
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
      tipo_derivacion?: "ambulatoria_especialista" | "urgencia" | "hospitalizacion" | "no_requiere";
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

export interface FeedbackResult {
  puntajes: {
    motivo_consulta: number;
    sintomas_relevantes: number;
    antecedentes: number;
    red_flags: number;
    razonamiento_clinico: number;
    comunicacion: number;
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
    identifico_red_flags: boolean;
    manejo_inicial_apropiado: boolean;
    considero_ingreso_programa?: boolean;
    metas_terapeuticas_definidas?: boolean;
    educacion_y_seguimiento_apropiados?: boolean;
    considero_factores_psicosociales?: boolean;
    comentario: string;
  };
}