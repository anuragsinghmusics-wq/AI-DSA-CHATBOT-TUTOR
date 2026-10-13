import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { ragService } from './services/rag.service.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import chatRoutes from './routes/chat.routes.js';
import problemRoutes from './routes/problem.routes.js';
import runRoutes from './routes/run.routes.js';

const app = express();

// ---- Middleware ----
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---- API Routes ----
app.use('/api/chat', chatRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/run', runRoutes);

// ---- Error Handler ----
app.use(errorHandler);

// ---- Start Server ----
async function start() {
  try {
    // Start HTTP server immediately — don't block on HuggingFace/RAG model load
    app.listen(env.PORT, () => {
      logger.info(`🚀 Deebug API running on port ${env.PORT}`);
      logger.info(`📋 Environment: ${env.NODE_ENV}`);
      logger.info('🤖 AI Engine: Gemini 2.5 Flash (via Google GenAI)');
      logger.info('🔍 Safety: Regex filter + Heuristic detector + Judge LLM');
    });

    // Initialize RAG Service in the background (non-blocking)
    // HuggingFace transformer model load can take 3-10s — no reason to delay server startup
    ragService.init().then(() => {
      logger.info('✅ RAG Service initialized in background');
    }).catch((err) => {
      logger.warn('⚠️ RAG Service failed to initialize — chat will have reduced context', { error: err });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();
