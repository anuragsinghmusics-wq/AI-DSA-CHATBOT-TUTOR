import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createJudgeLLM } from '../../llm/groqClient.js';
import { JUDGE_SYSTEM_PROMPT, buildJudgeMessage } from '../../prompts/judge.prompt.js';
import { logger } from '../../../utils/logger.js';
import type { TutorGraphStateType } from '../state.js';
import type { JudgeResult } from '../../../types/index.js';

const judgeLLM = createJudgeLLM();

/**
 * Node 6: Judge LLM
 * A second LLM that independently reviews the teacher's response
 * for code leakage. This is the final AI-powered safety layer.
 */
export async function judgeLLMNode(
  state: TutorGraphStateType
): Promise<Partial<TutorGraphStateType>> {
  logger.info('⚖️ Judge LLM: Reviewing response for code leakage...');

  try {
    const response = await judgeLLM.invoke([
      new SystemMessage(JUDGE_SYSTEM_PROMPT),
      new HumanMessage(buildJudgeMessage(state.teacherResponse)),
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Strip any <think>...</think> blocks
    const cleanedResponse = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Extract JSON from the response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      logger.warn('Judge returned non-JSON, defaulting to approved', {
        response: cleanedResponse.substring(0, 200),
      });
      return {
        judgeResult: { approved: true, reason: 'Judge response unparseable, defaulting to approve' },
      };
    }

    const parsedRaw = JSON.parse(jsonMatch[0]) as { containsCode: boolean, reason: string };
    
    const parsed: JudgeResult = {
      approved: !parsedRaw.containsCode,
      reason: parsedRaw.reason,
    };

    if (parsed.approved) {
      logger.info('✅ Judge approved — no code leakage detected');
    } else {
      logger.warn('❌ Judge REJECTED response', {
        reason: parsed.reason,
      });
    }

    return { judgeResult: parsed };
  } catch (error) {
    logger.error('Judge LLM error', { error });
    // On error, default to approved to avoid blocking all responses
    return {
      judgeResult: { approved: true, reason: 'Judge error, defaulting to approve' },
    };
  }
}
