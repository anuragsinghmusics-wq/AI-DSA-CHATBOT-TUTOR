import { StateGraph, END, START } from '@langchain/langgraph';
import { TutorGraphState, type TutorGraphStateType } from './state.js';
import { intentClassifierNode } from './nodes/intentClassifier.js';
import { promptBuilderNode } from './nodes/promptBuilder.js';
import { contextInjectorNode } from './nodes/contextInjector.js';
import { teacherLLMNode } from './nodes/teacherLLM.js';
import { safetyFilterNode } from './nodes/safetyFilter.js';
import { judgeLLMNode } from './nodes/judgeLLM.js';
import { responseFormatterNode } from './nodes/responseFormatter.js';
import { createTeacherLLM } from '../llm/groqClient.js';
import { buildSystemPrompt } from '../prompts/system.prompt.js';
import {
  buildOffTopicPrompt,
  buildBlockedPrompt,
} from '../prompts/teacher.prompt.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Intent, type ProblemContext, type ChatMessageData } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

const llm = createTeacherLLM();

// ---- Rejection & Block Nodes ----

/**
 * Sets isRefusalMode=true so the promptBuilder constructs a rich refusal prompt
 * and the Teacher LLM generates a natural, context-aware tutoring refusal.
 */
async function rejectionSetupNode(
  _state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.info('🚫 Rejection Setup: Routing to Teacher LLM for natural refusal');
  return { isRefusalMode: true };
}

async function offTopicNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.info('🔀 Off-Topic Node: Generating LLM redirect response');
  try {
    const prompt = buildOffTopicPrompt(
      state.problemContext,
      state.chatHistory,
      state.userMessage
    );
    const response = await llm.invoke([
      new SystemMessage(buildSystemPrompt(state.problemContext)),
      new HumanMessage(prompt),
    ]);
    const text = typeof response.content === 'string'
      ? response.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      : JSON.stringify(response.content);
    return { finalResponse: text };
  } catch (error) {
    logger.error('Off-topic LLM error', { error });
    return { finalResponse: `Let's get back to ${state.problemContext.title}! What aspect of the problem would you like to explore?` };
  }
}

async function blockedNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.warn('🔒 Blocked Node: Generating LLM recovery redirect');
  try {
    const prompt = buildBlockedPrompt(
      state.problemContext,
      state.chatHistory,
      state.userMessage
    );
    const response = await llm.invoke([
      new SystemMessage(buildSystemPrompt(state.problemContext)),
      new HumanMessage(prompt),
    ]);
    const text = typeof response.content === 'string'
      ? response.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      : JSON.stringify(response.content);
    return { finalResponse: text };
  } catch (error) {
    logger.error('Blocked LLM error', { error });
    return { finalResponse: `Let's focus on the core concept of ${state.problemContext.title}. Where in your thinking are you getting stuck?` };
  }
}

async function errorNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.error('⚠️ Error Node triggered', { error: state.error });
  return { finalResponse: `⚠️ Something went wrong on Deebug's end.\n\nError details: ${state.error}\n\nPlease try again in a moment.` };
}

// ---- Router Functions ----

function intentRouter(state: TutorGraphStateType): string {
  if (state.intent === Intent.REJECTED) {
    return 'rejectionSetup';
  }
  if (state.intent === Intent.OFF_TOPIC) {
    return 'offTopic';
  }
  // ✅ FIX: Route allowed intents to contextInjector FIRST so RAG context
  // is available when promptBuilder runs. Previously this was routed to
  // promptBuilder directly, meaning ragContext was always empty in the prompt.
  return 'contextInjector';
}

function safetyRouter(state: TutorGraphStateType): string {
  if (!state.safetyResult.safe) {
    return 'blocked';
  }
  return 'judgeLLM';
}

function judgeRouter(state: TutorGraphStateType): string {
  if (!state.judgeResult.approved) {
    return 'blocked';
  }
  return 'responseFormatter';
}

function errorRouter(state: TutorGraphStateType): string {
  if (state.error) {
    return 'errorNode';
  }
  return 'safetyFilter';
}

// ---- Build the Graph ----

function buildTutorGraph() {
  const workflow = new StateGraph(TutorGraphState)
    // Add all nodes
    .addNode('intentClassifier', intentClassifierNode)
    .addNode('rejectionSetup', rejectionSetupNode)
    .addNode('contextInjector', contextInjectorNode)
    .addNode('promptBuilder', promptBuilderNode)
    .addNode('teacherLLM', teacherLLMNode)
    .addNode('safetyFilter', safetyFilterNode)
    .addNode('judgeLLM', judgeLLMNode)
    .addNode('responseFormatter', responseFormatterNode)
    .addNode('offTopic', offTopicNode)
    .addNode('blocked', blockedNode)
    .addNode('errorNode', errorNode)

    // Entry point
    .addEdge(START, 'intentClassifier')

    // ✅ FIXED ROUTING:
    // - rejected   → rejectionSetup → promptBuilder (no RAG needed for refusals)
    // - off_topic  → offTopic → END
    // - allowed    → contextInjector → promptBuilder (RAG runs FIRST, then prompt is built)
    .addConditionalEdges('intentClassifier', intentRouter, {
      rejectionSetup: 'rejectionSetup',
      offTopic: 'offTopic',
      contextInjector: 'contextInjector',
    })

    // Rejection path: skip RAG, go straight to promptBuilder
    .addEdge('rejectionSetup', 'promptBuilder')

    // ✅ FIXED ORDER: contextInjector → promptBuilder → teacherLLM
    // Previously this was promptBuilder → contextInjector (backwards!)
    .addEdge('contextInjector', 'promptBuilder')
    .addEdge('promptBuilder', 'teacherLLM')

    // Error check after teacher
    .addConditionalEdges('teacherLLM', errorRouter, {
      errorNode: 'errorNode',
      safetyFilter: 'safetyFilter',
    })

    // Safety routing: unsafe → blocked, safe → judgeLLM
    .addConditionalEdges('safetyFilter', safetyRouter, {
      blocked: 'blocked',
      judgeLLM: 'judgeLLM',
    })

    // Judge routing: not approved → blocked, approved → responseFormatter
    .addConditionalEdges('judgeLLM', judgeRouter, {
      blocked: 'blocked',
      responseFormatter: 'responseFormatter',
    })

    // Terminal nodes
    .addEdge('responseFormatter', END)
    .addEdge('offTopic', END)
    .addEdge('blocked', END)
    .addEdge('errorNode', END);

  return workflow.compile();
}

// Compile the graph once (singleton)
const tutorGraph = buildTutorGraph();

/**
 * Runs the complete tutor pipeline using LangGraph's .stream() for node-level
 * event visibility. Yields intent early (before the full LLM response is ready)
 * so the frontend can show a "thinking" state with the classified intent.
 *
 * Architecture note: Full response is required before streaming tokens because
 * the safety filter and judge LLM must inspect the complete response first.
 * Tokens are streamed character-by-character after the safety pipeline passes.
 */
export async function* runTutorPipeline(input: {
  userMessage: string;
  problemContext: ProblemContext;
  chatHistory: ChatMessageData[];
}): AsyncGenerator<{ type: string; data: string }> {
  logger.info('🚀 Starting tutor pipeline', {
    problem: input.problemContext.title,
    messagePreview: input.userMessage.substring(0, 100),
  });

  try {
    // Use .stream() so we get per-node events and can yield intent early
    let intent: string = 'concept';
    let finalResponse: string = '';
    let isSafe: boolean = true;
    let safeApproved: boolean = true;

    for await (const chunk of await tutorGraph.stream({
      userMessage: input.userMessage,
      problemContext: input.problemContext,
      chatHistory: input.chatHistory,
    } as any)) {
      const nodeNames = Object.keys(chunk);

      for (const nodeName of nodeNames) {
        const nodeOutput = chunk[nodeName] as Partial<TutorGraphStateType>;

        // Yield intent as soon as the classifier finishes — gives immediate feedback
        if (nodeName === 'intentClassifier' && nodeOutput.intent) {
          intent = nodeOutput.intent as string;
          yield { type: 'intent', data: intent };
          logger.debug('Intent yielded early', { intent });
        }

        // Track safety pipeline results
        if (nodeName === 'safetyFilter' && nodeOutput.safetyResult) {
          isSafe = nodeOutput.safetyResult.safe;
        }
        if (nodeName === 'judgeLLM' && nodeOutput.judgeResult) {
          safeApproved = nodeOutput.judgeResult.approved;
        }

        // Capture final response from any terminal node
        if (nodeOutput.finalResponse !== undefined && nodeOutput.finalResponse !== '') {
          finalResponse = nodeOutput.finalResponse;
        }
      }
    }

    // Yield combined safety result
    const combinedSafe = isSafe && safeApproved;
    yield { type: 'safety', data: combinedSafe ? 'safe' : 'unsafe' };

    // Stream final response character-by-character for a natural typing effect
    if (finalResponse) {
      const chars = [...finalResponse]; // spread handles unicode correctly
      for (const char of chars) {
        yield { type: 'token', data: JSON.stringify(char) };
      }
    }

    logger.info('✅ Pipeline completed successfully', {
      intent,
      safe: combinedSafe,
      responseLength: finalResponse.length,
    });
  } catch (error) {
    logger.error('Pipeline error', { error });
    yield {
      type: 'error',
      data: error instanceof Error ? error.message : 'Pipeline execution failed',
    };
  }
}
