export interface ClinicalCase {
  id: string;
  especialidad: "medicina_interna" | "urgencia" | "respiratorio" | "digestivo" | "otro";
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
}