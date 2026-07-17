import type { ProblemContext, ChatMessageData } from '../../types/index.js';

/**
 * Teacher Prompt Template.
 * Constructs the full prompt with chat history and user question.
 */
export function buildTeacherPrompt(
  problemContext: ProblemContext, // Kept for signature compatibility, though context is now in SystemPrompt
  chatHistory: ChatMessageData[],
  userMessage: string,
  ragContext: string = ''
): string {
  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .slice(-10) // Last 10 messages for context (Sliding Window)
          .map((msg) => `${msg.role === 'USER' ? 'Student' : 'Tutor'}: ${msg.content}`)
          .join('\n\n')
      : 'No previous conversation.';

  const ragSection = ragContext
    ? `\n## ADDITIONAL CONTEXT (from knowledge base)\n${ragContext}\n`
    : '';

  return `${ragSection}## CONVERSATION HISTORY
${historyText}

## STUDENT'S QUESTION
${userMessage}

## YOUR TASK
Answer the student's question directly, strictly adhering to the length limit:

Answer the student's question directly according to the steps and rules outlined in your System Prompt.
Remember the Golden Rule: Teach the student HOW to solve the problem, do NOT solve the problem FOR the student.`;
}

/**
 * Builds a prompt specifically for when the student asked for code/solution.
 * Instructs the LLM to generate a natural, context-aware, tutor-style refusal
 * — NOT a template, but a genuine pedagogical response to THIS exact request.
 */
export function buildRefusalPrompt(
  problemContext: ProblemContext,
  chatHistory: ChatMessageData[],
  userMessage: string
): string {
  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .slice(-10)
          .map((msg) => `${msg.role === 'USER' ? 'Student' : 'Tutor'}: ${msg.content}`)
          .join('\n\n')
      : 'No previous conversation.';

  // Count how many times the student has already been refused in this session
  const priorRefusals = chatHistory.filter(
    (m) => m.role !== 'USER' && (
      m.content.includes("can't provide") ||
      m.content.includes("won't give") ||
      m.content.includes("building the solution yourself") ||
      m.content.includes("skip the most valuable")
    )
  ).length;

  const refusalGuidance = priorRefusals === 0
    ? `The student is asking for code for the first time. Gently explain WHY you can't give it, then immediately redirect them with a concrete, specific question or challenge about the problem — reference the actual problem title, its tags, or a specific step in the algorithm.`
    : priorRefusals === 1
    ? `The student asked again. They may be frustrated or truly stuck. Acknowledge their persistence with empathy, firmly but warmly reiterate you cannot give code, then dig deeper — ask them specifically what part of the algorithm or logic they are finding hard. Reference something concrete from the conversation history or the problem.`
    : `The student has asked multiple times. They are clearly stuck. Be compassionate, acknowledge the frustration, then actively guide them: pick the most relevant concept from the problem's tags, give them a very targeted conceptual question or a partial thought-starter (NOT code) to unstick them. Make it feel like a one-on-one tutoring session.`;

  return `## CONVERSATION HISTORY
${historyText}

## STUDENT'S REQUEST (asking for code/solution)
"${userMessage}"

## YOUR TASK — GENERATE A NATURAL TUTORING REFUSAL

${refusalGuidance}

STRICT RULES for your response:
- Do NOT say generic phrases like "I can't give code", "providing code won't help", "I'd love to help but...", or "That would skip the learning". These are robotic. Speak like a real tutor.
- Do NOT use pre-written templates. Your response must be unique and specific to THIS problem and THIS conversation.
- Do NOT give any code, pseudocode, or implementation.
- DO reference the specific problem title "${problemContext.title}" and its concepts.
- DO ask at least one concrete, pinpointed question that pushes the student forward.
- Keep it concise — max 4-5 sentences. Be warm, direct, and genuinely helpful.
- Your response should vary in tone and structure from any prior refusals in the conversation history above.`;
}

/**
 * Builds a prompt for when the student's message is off-topic.
 * The LLM generates a warm, specific redirect back to the active problem
 * instead of a generic "stay on topic" line.
 */
export function buildOffTopicPrompt(
  problemContext: ProblemContext,
  chatHistory: ChatMessageData[],
  userMessage: string
): string {
  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .slice(-10)
          .map((msg) => `${msg.role === 'USER' ? 'Student' : 'Tutor'}: ${msg.content}`)
          .join('\n\n')
      : 'No previous conversation.';

  return `## CONVERSATION HISTORY
${historyText}

## STUDENT'S OFF-TOPIC MESSAGE
"${userMessage}"

## YOUR TASK — REDIRECT THE STUDENT NATURALLY

The student asked something unrelated to the active problem "${problemContext.title}".
Your job is to acknowledge what they asked, briefly explain you're focused on DSA tutoring for this problem, and naturally redirect them back with a specific, engaging question or observation about "${problemContext.title}".

STRICT RULES:
- Do NOT say "I can only assist with..." or "Let's stay focused" — these are robotic and dismissive.
- Do NOT ignore their question entirely; briefly acknowledge it with one short sentence.
- DO pivot naturally back to "${problemContext.title}" and its specific concepts (tags: ${problemContext.tags.join(', ')}).
- Ask a concrete question or share an interesting observation about the problem to re-engage them.
- Keep it to 3-4 sentences maximum. Sound like a real tutor, not a policy notice.`;
}

/**
 * Builds a prompt for the "blocked" case — when the Teacher LLM accidentally
 * generated code/solutions and the safety layer caught it.
 * The LLM now generates a recovery response: redirecting the student without any code.
 */
export function buildBlockedPrompt(
  problemContext: ProblemContext,
  chatHistory: ChatMessageData[],
  userMessage: string
): string {
  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .slice(-10)
          .map((msg) => `${msg.role === 'USER' ? 'Student' : 'Tutor'}: ${msg.content}`)
          .join('\n\n')
      : 'No previous conversation.';

  return `## CONVERSATION HISTORY
${historyText}

## STUDENT'S QUESTION
"${userMessage}"

## YOUR TASK — REDIRECT WITHOUT CODE

You were about to give the student more than they should receive right now. Instead of giving implementation details, refocus the conversation by asking the student a targeted conceptual question about "${problemContext.title}".

STRICT RULES:
- Do NOT produce any code, pseudocode, or step-by-step algorithm implementation.
- Do NOT mention that something was blocked or filtered — just redirect naturally.
- DO ask one specific, pinpointed question about the problem's core concept that helps the student think for themselves.
- Reference the problem title "${problemContext.title}" and its tags (${problemContext.tags.join(', ')}) to make it feel personal.
- Keep it brief: 2-3 sentences. Sound warm and encouraging, like a real tutor nudging the student to think deeper.`;
}
