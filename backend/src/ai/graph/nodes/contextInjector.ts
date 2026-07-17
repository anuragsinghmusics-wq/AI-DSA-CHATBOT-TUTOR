import { logger } from '../../../utils/logger.js';
import type { TutorGraphStateType } from '../state.js';
import { ragService } from '../../../services/rag.service.js';

/**
 * Node 3: Context Injector (RAG-Ready)
 * 
 * Uses the RagService to:
 * 1. Generate an embedding for the user's question
 * 2. Query the local Vector Store for relevant concept chunks
 * 3. Inject the retrieved context into the ragContext field
 */
export async function contextInjectorNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.info('📚 Context Injector: Checking for RAG context...');

  try {
    const ragContext = await ragService.search(state.userMessage);
    
    if (ragContext) {
      logger.info('✅ RAG Context retrieved successfully.');
    } else {
      logger.debug('No relevant RAG context found.');
    }

    return { ragContext };
  } catch (error) {
    logger.error('Error during context injection', { error });
    return { ragContext: '' };
  }
}
