import type { ProblemContext, ChatMessageData, UserProfileData, UserMemoryData } from '../../types/index.js';

/**
 * Format Long-Term Memory and User Profile into prompt instructions.
 */
function formatMemorySection(userProfile?: UserProfileData, userMemories?: UserMemoryData[]): string {
  if (!userProfile && (!userMemories || userMemories.length === 0)) {
    return '';
  }

  const lines: string[] = ['## STUDENT LEARNING PROFILE & LONG-TERM MEMORY'];

  const hasCustomName = userProfile?.name && userProfile.name !== 'Dev User' && userProfile.name !== 'Alex (DSA Learner)';

  if (userProfile) {
    if (hasCustomName) {
      lines.push(`- Student Name: ${userProfile.name}`);
    }
    lines.push(`- Skill Level: ${userProfile.skillLevel}`);
    lines.push(`- Preferred Language: ${userProfile.preferredLanguage}`);
    if (userProfile.learningGoals) {
      lines.push(`- Learning Goals: ${userProfile.learningGoals}`);
    }
  }

  if (userMemories && userMemories.length > 0) {
    lines.push('\n### Pedagogical & Personal Insights Learned From Past Sessions:');
    userMemories.slice(0, 10).forEach((m) => {
      const source = m.sourceProblem ? ` (observed on: ${m.sourceProblem})` : '';
      lines.push(`- [${m.category}] ${m.content}${source}`);
    });
  }

  lines.push('\nPEDAGOGICAL INSTRUCTIONS BASED ON LONG-TERM MEMORY:');
  if (hasCustomName) {
    lines.push(`- The student's name is ${userProfile!.name}. Address them warmly by name when greeting or answering personal questions.`);
    lines.push(`- If the student asks "what is my name", "who am I", "do you remember me", or asks what you know about them, ALWAYS answer them directly and accurately using their name and memories!`);
  }
  lines.push('- Calibrate the depth of your explanations and hints to this student’s skill level.');
  lines.push('- If this student has a known WEAKNESS or misconception related to this problem, proactively guide them around that blind spot with Socratic questioning.');
  lines.push('- If this student has a known LEARNING_STYLE (e.g. prefers dry runs or visualization), emphasize that style in your explanation.');
  lines.push('- Acknowledge their past growth and milestones to build algorithmic confidence.\n');

  return lines.join('\n') + '\n';
}

/**
 * Teacher Prompt Template.
 * Constructs the full prompt with user profile, chat history, RAG context, and user question.
 */
export function buildTeacherPrompt(
  problemContext: ProblemContext, // Kept for signature compatibility, though context is now in SystemPrompt
  chatHistory: ChatMessageData[],
  userMessage: string,
  ragContext: string = '',
  userCode?: string,
  language?: string,
  userProfile?: UserProfileData,
  userMemories?: UserMemoryData[]
): string {
  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .slice(-10) // Last 10 messages for context (Sliding Window)
          .map((msg) => `${msg.role === 'USER' ? 'Student' : 'Tutor'}: ${msg.content}`)
          .join('\n\n')
      : 'No previous conversation.';

  const memorySection = formatMemorySection(userProfile, userMemories);

  const ragSection = ragContext
    ? `\n## ADDITIONAL CONTEXT (from knowledge base)\n${ragContext}\n`
    : '';

  const codeSection = userCode && userCode.trim() !== ''
    ? `\n## STUDENT'S CURRENT CODE (${language || 'unknown language'})\n\`\`\`${language || ''}\n${userCode}\n\`\`\`\nDo NOT give the student direct code solutions. Use their provided code to point out logical flaws or syntax errors.\n`
    : '';

  return `${memorySection}${ragSection}## CONVERSATION HISTORY
${historyText}

## STUDENT'S QUESTION
${userMessage}
${codeSection}
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
  userMessage: string,
  userProfile?: UserProfileData,
  userMemories?: UserMemoryData[]
): string {
  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .slice(-10)
          .map((msg) => `${msg.role === 'USER' ? 'Student' : 'Tutor'}: ${msg.content}`)
          .join('\n\n')
      : 'No previous conversation.';

  const memorySection = formatMemorySection(userProfile, userMemories);

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

  return `${memorySection}## CONVERSATION HISTORY
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
  userMessage: string,
  userProfile?: UserProfileData,
  userMemories?: UserMemoryData[]
): string {
  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .slice(-10)
          .map((msg) => `${msg.role === 'USER' ? 'Student' : 'Tutor'}: ${msg.content}`)
          .join('\n\n')
      : 'No previous conversation.';

  const memorySection = formatMemorySection(userProfile, userMemories);

  return `${memorySection}## CONVERSATION HISTORY
${historyText}

## STUDENT'S MESSAGE
"${userMessage}"

## YOUR TASK — RESPOND NATURALLY & REDIRECT
The student asked or said something tangential to the active problem "${problemContext.title}".
- If the student asked about their own name, who they are, or what you remember about them: Answer them directly, accurately, and warmly using their Long-Term Memory / profile above! Then naturally link back to the problem "${problemContext.title}".
- Otherwise: Acknowledge what they asked in 1 short sentence, and pivot naturally back to "${problemContext.title}" and its specific concepts (tags: ${problemContext.tags.join(', ')}).

STRICT RULES:
- Do NOT say "I can only assist with..." or "Let's stay focused" — these are robotic and dismissive.
- Ask a concrete question or share an interesting observation about the problem to re-engage them.
- Keep it to 3-4 sentences maximum. Sound like a real, supportive tutor.`;
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
