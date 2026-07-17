# Deebug — AI-Powered DSA Tutor Chatbot

> An intelligent DSA tutoring system that teaches concepts without ever revealing solutions.

## Architecture

```
User → Frontend (Next.js) → Express API → LangGraph Pipeline → Ollama (Qwen3 8B)
                                              ↓
                              Intent Classifier → Prompt Builder → Context Injector
                                                                        ↓
                              Response ← Judge LLM ← Safety Filter ← Teacher LLM
```

### 5-Layer Safety System
1. **Intent Classification** — Blocks code/solution requests at the input
2. **System Prompt Rules** — Strict LLM instructions against code generation
3. **Regex Detection** — 50+ patterns detecting code across 10+ languages
4. **Heuristic Analysis** — Structural code detection (indentation, semicolons, braces)
5. **Judge LLM** — Independent AI reviewer checking for code leakage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| AI Engine | LangChain.js, LangGraph.js |
| LLM | Qwen3 8B via Ollama |
| Database | PostgreSQL (Prisma ORM) |
| Cache | Redis |
| Vector DB | Qdrant (RAG-ready) |

## Prerequisites

- **Node.js** 18+
- **Docker** & Docker Compose
- **Ollama** ([install from ollama.com](https://ollama.com))

## Quick Start

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Pull the LLM Model
```bash
ollama pull qwen3:8b
```

### 3. Setup Backend
```bash
cd backend
cp ../.env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Open the App
Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message (SSE streaming) |
| GET | `/api/chat/history/:sessionId` | Get chat history |
| DELETE | `/api/chat/history/:sessionId` | Delete chat history |
| POST | `/api/chat/feedback` | Submit feedback |
| GET | `/api/problems` | List all problems |
| GET | `/api/problems/:id` | Get problem details |

## Project Structure

```
deebug-chatbot/
├── frontend/          # Next.js 14 App
│   └── src/
│       ├── app/       # Next.js App Router
│       ├── components/
│       │   ├── chat/  # ChatPanel, ChatMessage, ChatInput
│       │   ├── problem/ # ProblemView
│       │   └── layout/  # AppLayout
│       ├── hooks/     # useChat
│       ├── lib/       # API client
│       └── types/     # TypeScript types
│
├── backend/           # Express Server
│   └── src/
│       ├── ai/
│       │   ├── graph/
│       │   │   ├── nodes/  # 7 LangGraph nodes
│       │   │   ├── state.ts
│       │   │   └── workflow.ts
│       │   ├── prompts/    # System, Intent, Teacher, Judge
│       │   ├── safety/     # Regex, Heuristic, Validator
│       │   └── llm/        # Ollama client
│       ├── config/         # DB, Redis, Env
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── middleware/
│       └── routes/
│
└── docker-compose.yml
```

## Future Enhancements (RAG-Ready)

The Context Injector node is designed to integrate with Qdrant. When ready:
1. Index concept libraries, hints, and editorials into Qdrant
2. Enable the RAG pipeline in `contextInjector.ts`
3. No other changes needed — the architecture supports it seamlessly
