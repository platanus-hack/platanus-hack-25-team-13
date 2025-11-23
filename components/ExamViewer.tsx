"use client";

import { useState } from "react";
import Image from "next/image";
import type { RequestedExam } from "@/types/case";

interface ExamViewerProps {
  requestedExams: RequestedExam[];
}

export default function ExamViewer({ requestedExams }: ExamViewerProps) {
  const [selectedExam, setSelectedExam] = useState<RequestedExam | null>(
    requestedExams.length > 0 ? requestedExams[requestedExams.length - 1] : null
  );

  // Auto-select the newest exam when a new one is added
  if (
    requestedExams.length > 0 &&
    selectedExam &&
    requestedExams[requestedExams.length - 1].requestedAt !== selectedExam.requestedAt
  ) {
    setSelectedExam(requestedExams[requestedExams.length - 1]);
  }

  const examTypeMap: Record<string, string> = {
    radiografia: "Radiografía",
    ecografia: "Ecografía",
    electrocardiograma: "Electrocardiograma",
    tomografia: "Tomografía",
    resonancia: "Resonancia Magnética",
    examen_fisico: "Examen Físico",
  };

  if (requestedExams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No se han solicitado exámenes aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Exam tabs */}
      <div className="flex flex-wrap gap-2">
        {requestedExams.map((exam, index) => (
          <button
            key={`${exam.tipo}-${index}`}
            onClick={() => setSelectedExam(exam)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedExam === exam
                ? "bg-[#1098f7] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {examTypeMap[exam.tipo] || exam.tipo} #{index + 1}
          </button>
        ))}
      </div>

      {/* Selected exam display */}
      {selectedExam && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="mb-4">
            <h4 className="font-semibold text-lg text-[#001c55] mb-2">
              {examTypeMap[selectedExam.tipo] || selectedExam.tipo}
            </h4>
            {selectedExam.clasificacion && (
              <p className="text-sm text-gray-600">
                Clasificación: {selectedExam.clasificacion}
              </p>
            )}
            {selectedExam.subclasificacion && (
              <p className="text-sm text-gray-600">
                Subclasificación: {selectedExam.subclasificacion}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Solicitado: {new Date(selectedExam.requestedAt).toLocaleString()}
            </p>
          </div>

          {selectedExam.imageUrl ? (
              <Image
                src={selectedExam.imageUrl}
                alt={`${selectedExam.tipo} - ${selectedExam.clasificacion || "general"}`}
                className="w-full h-auto rounded"
                width={800}
                height={600}
                style={{ width: "100%", height: "auto" }}
                unoptimized
              />
          ) : (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-center">
              <p className="text-yellow-800">
                Este examen no está disponible en el sistema.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}