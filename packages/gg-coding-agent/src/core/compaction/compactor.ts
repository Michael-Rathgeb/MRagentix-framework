import { stream, type Message, type Provider } from "@kenkaiiii/gg-ai";
import { estimateConversationTokens, estimateMessageTokens } from "./token-estimator.js";

export interface CompactionResult {
  originalCount: number;
  newCount: number;
  tokensBeforeEstimate: number;
  tokensAfterEstimate: number;
}

/**
 * Check if compaction should be triggered.
 */
export function shouldCompact(
  messages: Message[],
  contextWindow: number,
  threshold = 0.8,
): boolean {
  const estimated = estimateConversationTokens(messages);
  return estimated > contextWindow * threshold;
}

/**
 * Find the index where recent messages should start, given a token budget.
 * Walks backward from the end, accumulating token estimates, and returns the
 * first index that fits within the budget. Never cuts at index 0 (system message).
 * Avoids splitting tool_call / tool_result pairs.
 */
export function findRecentCutPoint(messages: Message[], tokenBudget: number): number {
  if (messages.length <= 1) return messages.length;

  let accumulated = 0;
  let cutIndex = messages.length;

  // Walk backwards from the last message
  for (let i = messages.length - 1; i >= 1; i--) {
    const tokens = estimateMessageTokens(messages[i]);
    if (accumulated + tokens > tokenBudget) {
      break;
    }
    accumulated += tokens;
    cutIndex = i;
  }

  // Don't split tool_call and tool_result pairs:
  // If cut lands on a tool result message, back up to include the preceding assistant
  if (cutIndex < messages.length && messages[cutIndex].role === "tool") {
    // Back up to find the assistant message with the tool_call
    if (cutIndex > 1) {
      cutIndex--;
    }
  }

  // Never cut before index 1 (preserve system message at 0)
  return Math.max(1, cutIndex);
}

/**
 * Compact a conversation by summarizing middle messages via LLM.
 * Returns a new messages array with summarized middle section.
 */
export async function compact(
  messages: Message[],
  options: {
    provider: Provider;
    model: string;
    apiKey?: string;
    contextWindow: number;
    signal?: AbortSignal;
  },
): Promise<{ messages: Message[]; result: CompactionResult }> {
  const originalCount = messages.length;
  const tokensBeforeEstimate = estimateConversationTokens(messages);

  // Keep system message (index 0) and last ~8 messages
  const KEEP_RECENT = 8;
  const systemMessage = messages[0];
  const recentStart = Math.max(1, messages.length - KEEP_RECENT);
  const recentMessages = messages.slice(recentStart);
  const middleMessages = messages.slice(1, recentStart);

  // If there's nothing to compact, return as-is
  if (middleMessages.length <= 2) {
    return {
      messages: [...messages],
      result: {
        originalCount,
        newCount: messages.length,
        tokensBeforeEstimate,
        tokensAfterEstimate: tokensBeforeEstimate,
      },
    };
  }

  // Build summary request
  const summaryContent = middleMessages
    .map((m) => {
      const role = m.role;
      const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      return `[${role}]: ${text}`;
    })
    .join("\n\n");

  const summaryPrompt =
    `Summarize the following conversation segment concisely. ` +
    `Focus on: key decisions made, files modified, tool results, and important context needed to continue the conversation. ` +
    `Be factual and brief.\n\n${summaryContent}`;

  const summaryMessages: Message[] = [{ role: "user", content: summaryPrompt }];

  const result = stream({
    provider: options.provider,
    model: options.model,
    messages: summaryMessages,
    maxTokens: 2048,
    apiKey: options.apiKey,
    signal: options.signal,
  });

  const response = await result.response;
  const summaryText =
    typeof response.message.content === "string"
      ? response.message.content
      : response.message.content
          .filter((p) => p.type === "text")
          .map((p) => (p as { text: string }).text)
          .join("");

  // Build new messages array
  const summaryMessage: Message = {
    role: "user",
    content: `[Previous conversation summary]\n\n${summaryText}`,
  };

  const newMessages: Message[] = [
    systemMessage,
    summaryMessage,
    {
      role: "assistant",
      content:
        "I understand. I have the context from our previous conversation. How can I help you continue?",
    },
    ...recentMessages,
  ];

  const tokensAfterEstimate = estimateConversationTokens(newMessages);

  return {
    messages: newMessages,
    result: {
      originalCount,
      newCount: newMessages.length,
      tokensBeforeEstimate,
      tokensAfterEstimate,
    },
  };
}
