import {
  Simulation,
  ClinicalCase,
  PatientContext,
  ChatMessage,
  FeedbackResult,
} from "@/types/case";
import {
  generateClinicalCase,
  CaseCreatorOptions,
} from "@/lib/agents/caseCreatorAgent";
import {
  generateInitialGreeting,
  generatePatientResponse,
} from "@/lib/agents/patientAgent";
import {
  decideAction,
  SystemAction,
  DecisionResult,
} from "@/lib/agents/decisionAgent";
import { generateFeedback } from "@/lib/agents/feedbackAgent";
import { generateCaseWithRAG } from "@/lib/assistant";
import { caseGenerationPrompts } from "@/lib/prompts";

/**
 * Simulation Engine
 * Orchestrates the clinical simulation by managing case creation,
 * patient interactions, and conversation state
 */

// Use global object to persist simulations across hot reloads in development
declare global {
  var simulations: Map<string, Simulation> | undefined;
}

// Initialize or reuse existing Map
const simulations = global.simulations ?? new Map<string, Simulation>();

// Store in global for persistence across hot reloads
if (process.env.NODE_ENV === "development") {
  global.simulations = simulations;
}

/**
 * Creates a patient context from a clinical case
 */
function createPatientContextFromCase(
  clinicalCase: ClinicalCase
): PatientContext {
  return {
    clinicalCase,
    personalityTraits: [
      "Responde de manera natural",
      "Puede mostrar emociones leves",
      "Puede tener dudas sobre términos médicos",
    ],
  };
}

export class SimulationEngine {
  /**
   * Creates a new simulation with a generated clinical case
   * Automatically uses RAG for APS cases
   */
  static async createSimulation(
    options: CaseCreatorOptions = {}
  ): Promise<{ simulation: Simulation; initialMessage: string }> {
    try {
      // Step 1: Generate clinical case
      // If specialty is APS, use RAG with Assistant API
      let clinicalCase: ClinicalCase;
      const specialty = options.specialty || "medicina_interna";
      const difficulty = options.difficulty || "medium";

      if (specialty === "aps") {
        // Map difficulty to nivel_dificultad
        const nivelDificultadMap: Record<
          "easy" | "medium" | "hard",
          "facil" | "medio" | "dificil"
        > = {
          easy: "facil",
          medium: "medio",
          hard: "dificil",
        };
        const nivel_dificultad = nivelDificultadMap[difficulty] || "medio";

        // Seleccionar subcategoría aleatoria
        const apsSubcategorias = [
          "cardiovascular",
          "respiratorio",
          "metabolico",
          "salud_mental",
          "musculoesqueletico",
        ];
        const subcategoria =
          apsSubcategorias[Math.floor(Math.random() * apsSubcategorias.length)];

        const prompt = `${caseGenerationPrompts.system(
          specialty,
          nivel_dificultad,
          subcategoria
        )}

${caseGenerationPrompts.user()}`;

        const output = await generateCaseWithRAG(
          specialty,
          nivel_dificultad,
          prompt
        );

        if (!output) {
          throw new Error("No se recibió respuesta del modelo");
        }

        // Extraer el JSON de la respuesta (puede venir con texto adicional)
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : output;

        clinicalCase = JSON.parse(jsonString) as ClinicalCase;
        if (!clinicalCase.paciente || !clinicalCase.motivo_consulta) {
          throw new Error("Caso incompleto");
        }

        if (!clinicalCase.id) {
          clinicalCase.id = `case-aps-${Date.now()}`;
        }

        // Añadir subcategoría al caso
        clinicalCase.aps_subcategoria =
          subcategoria as ClinicalCase["aps_subcategoria"];
      } else {
        // For other specialties, use the standard case creator
        clinicalCase = await generateClinicalCase(options);
      }

      // Step 2: Create patient context
      const patientContext = createPatientContextFromCase(clinicalCase);

      // Step 3: Generate initial patient greeting
      const initialMessage = await generateInitialGreeting(clinicalCase);

      // Step 4: Create simulation object
      const simulation: Simulation = {
        id: clinicalCase.id,
        clinicalCase,
        patientContext,
        chatHistory: [
          {
            role: "assistant",
            content: initialMessage,
            timestamp: new Date(),
          },
        ],
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Step 5: Store simulation
      simulations.set(simulation.id, simulation);

      return { simulation, initialMessage };
    } catch (error) {
      console.error("Error creating simulation:", error);
      throw new Error("Failed to create simulation. Please try again.");
    }
  }

  /**
   * INTELLIGENT MESSAGE PROCESSOR
   * Analyzes the user's message and decides what action to take automatically
   */
  static async processMessage(
    simulationId: string,
    message: string
  ): Promise<{
    actionTaken: SystemAction;
    response?: string;
    feedback?: FeedbackResult;
    reasoning: string;
    timestamp: Date;
  }> {
    const simulation = simulations.get(simulationId);

    if (!simulation) {
      console.error(`[SimulationEngine] Simulation ${simulationId} not found!`);
      throw new Error(
        "Simulation not found. It may have expired or been deleted."
      );
    }

    if (simulation.status !== "active") {
      throw new Error("This simulation is no longer active.");
    }

    try {
      // Step 1: Add user message to history
      const userMessage: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      simulation.chatHistory.push(userMessage);

      // Step 2: Let the Decision Agent analyze and decide
      const decision: DecisionResult = await decideAction(
        message,
        simulation.chatHistory
      );

      let response: string | undefined;
      let feedback: FeedbackResult | undefined;

      // Step 3: Execute the decided action
      switch (decision.action) {
        case "patient_interaction":
          // Generate patient response
          const patientResponse = await generatePatientResponse(
            simulation.clinicalCase,
            simulation.chatHistory,
            message
          );

          // Add patient's response to history
          const patientMessage: ChatMessage = {
            role: "assistant",
            content: patientResponse.message,
            timestamp: patientResponse.timestamp,
          };
          simulation.chatHistory.push(patientMessage);
          response = patientResponse.message;
          break;

        case "submit_diagnosis":
          // Extract diagnosis from user message or use the one from decision
          const diagnosis = decision.extractedDiagnosis || message;

          // Generate feedback
          feedback = await generateFeedback(
            simulation.clinicalCase,
            simulation.chatHistory.slice(0, -1), // Exclude the diagnosis message
            diagnosis
          );

          // Mark simulation as completed
          simulation.status = "completed";

          response = "✓ Diagnóstico recibido. Generando tu evaluación...";
          break;

        case "end_simulation":
          // Mark simulation as abandoned
          simulation.status = "abandoned";
          response =
            "Entendido. La simulación ha sido finalizada. Puedes volver cuando quieras.";
          break;
      }

      // Update simulation
      simulation.updatedAt = new Date();
      simulations.set(simulationId, simulation);

      return {
        actionTaken: decision.action,
        response,
        feedback,
        reasoning: decision.reasoning,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error processing message:", error);
      throw new Error("Failed to process message. Please try again.");
    }
  }

  /**
   * @deprecated Use processMessage instead for intelligent routing
   * Sends a message from the doctor to the patient
   * Returns the patient's response
   */
  static async sendMessage(
    simulationId: string,
    message: string
  ): Promise<{ response: string; timestamp: Date }> {
    const simulation = simulations.get(simulationId);

    if (!simulation) {
      throw new Error(
        "Simulation not found. It may have expired or been deleted."
      );
    }

    if (simulation.status !== "active") {
      throw new Error("This simulation is no longer active.");
    }

    try {
      // Add doctor's message to history
      const doctorMessage: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      simulation.chatHistory.push(doctorMessage);

      // Generate patient response using the patient agent
      const patientResponse = await generatePatientResponse(
        simulation.clinicalCase,
        simulation.chatHistory,
        message
      );

      // Add patient's response to history
      const patientMessage: ChatMessage = {
        role: "assistant",
        content: patientResponse.message,
        timestamp: patientResponse.timestamp,
      };
      simulation.chatHistory.push(patientMessage);

      // Update simulation
      simulation.updatedAt = new Date();
      simulations.set(simulationId, simulation);

      return {
        response: patientResponse.message,
        timestamp: patientResponse.timestamp,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to get patient response. Please try again.");
    }
  }

  /**
   * Retrieves a simulation by ID
   */
  static getSimulation(
    simulationId: string,
    includeDiagnosis = false
  ): Simulation | null {
    const simulation = simulations.get(simulationId);

    if (!simulation) {
      return null;
    }

    // If diagnosis should not be included, return a copy without it
    if (!includeDiagnosis) {
      return {
        ...simulation,
        clinicalCase: {
          ...simulation.clinicalCase,
          diagnostico_principal: "[Hidden]",
          diagnosticos_diferenciales: [],
        },
      };
    }

    return simulation;
  }

  /**
   * Marks a simulation as completed
   */
  static completeSimulation(simulationId: string): boolean {
    const simulation = simulations.get(simulationId);

    if (!simulation) {
      return false;
    }

    simulation.status = "completed";
    simulation.updatedAt = new Date();
    simulations.set(simulationId, simulation);

    return true;
  }

  /**
   * Abandons a simulation (user left without completing)
   */
  static abandonSimulation(simulationId: string): boolean {
    const simulation = simulations.get(simulationId);

    if (!simulation) {
      return false;
    }

    simulation.status = "abandoned";
    simulation.updatedAt = new Date();
    simulations.set(simulationId, simulation);

    return true;
  }

  /**
   * Updates a simulation in storage
   */
  static updateSimulation(
    simulationId: string,
    simulation: Simulation
  ): boolean {
    if (!simulations.has(simulationId)) {
      return false;
    }

    simulation.updatedAt = new Date();
    simulations.set(simulationId, simulation);
    return true;
  }

  /**
   * Deletes a simulation from memory
   */
  static deleteSimulation(simulationId: string): boolean {
    return simulations.delete(simulationId);
  }

  /**
   * Gets all active simulations (for debugging/admin purposes)
   */
  static getAllSimulations(): Simulation[] {
    return Array.from(simulations.values());
  }
}

export default SimulationEngine;
