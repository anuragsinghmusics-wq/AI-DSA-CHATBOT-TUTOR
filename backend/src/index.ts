import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { ragService } from './services/rag.service.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import chatRoutes from './routes/chat.routes.js';
import problemRoutes from './routes/problem.routes.js';

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

// ---- Error Handler ----
app.use(errorHandler);

// ---- Start Server ----
async function start() {
  try {
    // Initialize RAG Service (Loads/builds Vector Store)
    await ragService.init();

    app.listen(env.PORT, () => {
      logger.info(`🚀 Deebug API running on port ${env.PORT}`);
      logger.info(`📋 Environment: ${env.NODE_ENV}`);
      logger.info('🤖 AI Engine: Gemini 2.5 Flash (via Google GenAI)');
      logger.info('🔍 Safety: Regex filter + Heuristic detector + Judge LLM');
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();
