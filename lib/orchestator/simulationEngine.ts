import type {
  ChatMessage,
  ClinicalCase,
  FeedbackResult,
  PatientContext,
  Simulation,
} from "@/types/case";
import {
  type CaseCreatorOptions,
  generateClinicalCase,
} from "@/lib/agents/caseCreatorAgent";
import {
  generateExamPresentationResponse,
  generateInitialGreeting,
  generatePatientResponse,
} from "@/lib/agents/patientAgent";
import {
  decideAction,
  type DecisionResult,
  type SystemAction,
} from "@/lib/agents/decisionAgent";
import { generateFeedback } from "@/lib/agents/feedbackAgent";
import { type ExamResult, processExamRequest } from "@/lib/agents/examAgent";
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
  clinicalCase: ClinicalCase,
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
    options: CaseCreatorOptions = {},
  ): Promise<{ simulation: Simulation; initialMessage: string }> {
    try {
      // Step 1: Generate clinical case
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

        const prompt = `${
          caseGenerationPrompts.system(
            specialty,
            nivel_dificultad,
            subcategoria,
          )
        }

${caseGenerationPrompts.user()}`;

        const output = await generateCaseWithRAG(
          specialty,
          nivel_dificultad,
          prompt,
        );

        if (!output) {
          throw new Error("No se recibió respuesta del modelo");
        }

        // Extraer el JSON de la respuesta
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : output;

        clinicalCase = JSON.parse(jsonString) as ClinicalCase;
        if (!clinicalCase.paciente || !clinicalCase.motivo_consulta) {
          throw new Error("Caso incompleto");
        }

        if (!clinicalCase.id) {
          clinicalCase.id = `case-aps-${Date.now()}`;
        }

        clinicalCase.aps_subcategoria =
          subcategoria as ClinicalCase["aps_subcategoria"];
      } else {
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
        requestedExams: [],
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
    message: string,
  ): Promise<{
    actionTaken: SystemAction;
    response?: string;
    feedback?: FeedbackResult;
    examResult?: ExamResult;
    reasoning: string;
    timestamp: Date;
  }> {
    const simulation = simulations.get(simulationId);

    if (!simulation) {
      console.error(`[SimulationEngine] Simulation ${simulationId} not found!`);
      throw new Error(
        "Simulation not found. It may have expired or been deleted.",
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
        simulation.chatHistory,
      );

      let response: string | undefined;
      let feedback: FeedbackResult | undefined;
      let examResult: ExamResult | undefined;

      // Step 3: Execute the decided action
      switch (decision.action) {
        case "patient_interaction":
          // Generate patient response
          const patientResponse = await generatePatientResponse(
            simulation.clinicalCase,
            simulation.chatHistory,
            message,
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

        case "request_exam":
          // Process exam request
          if (!decision.examRequest) {
            response =
              "Lo siento, no pude procesar su solicitud de examen. Por favor especifique qué tipo de examen necesita.";
            break;
          }

          // Build conversation context for the exam agent
          const recentMessages = simulation.chatHistory.slice(-5);
          const conversationContext = recentMessages
            .map(
              (msg) =>
                `${
                  msg.role === "user" ? "Estudiante" : "Paciente"
                }: ${msg.content}`,
            )
            .join("\n");

          // Process the exam request
          examResult = await processExamRequest(
            decision.examRequest,
            conversationContext,
          );

          // Generate patient response (patient presents the exam)
          response = await generateExamPresentationResponse(
            simulation.clinicalCase,
            decision.examRequest.tipo,
            examResult.success,
          );

          // Add exam to requested exams history
          if (!simulation.requestedExams) {
            simulation.requestedExams = [];
          }
          simulation.requestedExams.push({
            tipo: decision.examRequest.tipo,
            clasificacion: decision.examRequest.clasificacion,
            subclasificacion: decision.examRequest.subclasificacion,
            imageUrl: examResult.imageUrl,
            requestedAt: new Date(),
            found: examResult.success,
          });

          // Add patient response to chat history
          const examMessage: ChatMessage = {
            role: "assistant",
            content: response,
            timestamp: new Date(),
          };
          simulation.chatHistory.push(examMessage);
          break;

        case "submit_diagnosis":
          // Extract diagnosis from user message or use the one from decision
          const diagnosis = decision.extractedDiagnosis || message;

          // Generate feedback
          feedback = await generateFeedback(
            simulation.clinicalCase,
            simulation.chatHistory.slice(0, -1), // Exclude the diagnosis message
            diagnosis,
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
        examResult,
        reasoning: decision.reasoning,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error processing message:", error);
      throw new Error("Failed to process message. Please try again.");
    }
  }

  /**
   * Gets a simulation by ID
   */
  static getSimulation(
    simulationId: string,
    includeDiagnosis = false,
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
   * Gets all active simulations
   */
  static getAllSimulations(): Simulation[] {
    return Array.from(simulations.values());
  }

  /**
   * Deletes a simulation
   */
  static deleteSimulation(simulationId: string): boolean {
    return simulations.delete(simulationId);
  }

  /**
   * Updates simulation status
   */
  static updateSimulationStatus(
    simulationId: string,
    status: "active" | "completed" | "abandoned",
  ): void {
    const simulation = simulations.get(simulationId);
    if (simulation) {
      simulation.status = status;
      simulation.updatedAt = new Date();
    }
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
    simulation: Simulation,
  ): boolean {
    if (!simulations.has(simulationId)) {
      return false;
    }

    simulation.updatedAt = new Date();
    simulations.set(simulationId, simulation);
    return true;
  }
}

export default SimulationEngine;
