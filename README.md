# Simiton - Medical Simulation Platform

<img src="./project-logo.png" alt="Simiton Logo" width="200" />

## Overview

AI-powered clinical case simulation platform for medical training. Students interact with virtual patients, request exams, and submit diagnoses to receive detailed feedback.

## Key Features

- **Virtual Patient Interactions**: Chat with AI patients presenting realistic symptoms
- **Intelligent Case Generation**: Clinical cases based on Chilean MINSAL guidelines (with RAG)
- **Multi-specialty Support**: APS (Primary Care), Emergency, and Hospitalization cases
- **Exam System**: Request and view medical images (X-rays, ultrasounds, ECGs, etc.)
- **Voice Mode**: Practice with voice-based patient interactions
- **Performance Analytics**: Track progress, view history, and improve skills
- **Smart Feedback**: Detailed evaluation of clinical reasoning and decision-making

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 with RAG (Assistants API)
- **Voice**: ElevenLabs
- **Styling**: Tailwind CSS 4

## Getting Started

### Prerequisites

- Node.js 20+
- OpenAI API key
- Supabase account
- ElevenLabs API key (for voice mode)

### Environment Variables

Create `.env.local`:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_assistant_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ElevenLabs (optional)
NEXT_PUBLIC_XI_API_KEY=your_elevenlabs_key

# Dev mode (optional)
NEXT_PUBLIC_DEV=false
```

### Installation

```bash
npm install
npm run dev
```

Open [www.medsim.cl/](https://www.medsim.cl/)

## Architecture

```
lib/
├── agents/              # AI agent modules
│   ├── caseCreatorAgent.ts    # Case generation
│   ├── patientAgent.ts        # Patient responses
│   ├── decisionAgent.ts       # Action routing
│   ├── examAgent.ts           # Exam processing
│   └── feedbackAgent.ts       # Evaluation
├── orchestator/
│   └── simulationEngine.ts    # Core simulation logic
├── exams.ts             # Exam image matching
└── prompts.ts           # LLM prompts

app/
├── dashboard/           # Main dashboard
├── anamnesis/          # Patient interaction
├── resultados/         # Feedback results
├── api/         
└── voice-agent/        # Voice mode

```

## Team

- Felipe Cárdenas ([@Felipedino](https://github.com/Felipedino))
- Camilo Huerta ([@CamiloPolit](https://github.com/CamiloPolit))
- Francisco Cea ([@fcocea](https://github.com/fcocea))
- Jorge Cruces ([@jcrucesdeveloper](https://github.com/jcrucesdeveloper))

## Project Info

**Platanus Hack 2025** | Track: ☎️ Legacy | Team 13
