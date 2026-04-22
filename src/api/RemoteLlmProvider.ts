import type { LlmProviderPort } from "../core/ports/LlmProviderPort";
import type {
  AiActivityProposal,
  AiPlannerMessage,
  AiPlannerResponse,
  LlmProviderKind,
} from "../models/domain";

function messagesToText(messages: AiPlannerMessage[]): string {
  return messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");
}

function parseActivities(answer: string): AiActivityProposal[] {
  const lines = answer
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));

  return lines.slice(0, 3).map((line, index) => ({
    title: line.replace(/^-\s*/, ""),
    estimatedCostEuro: 10 + index * 8,
    reason: "Estimated by AI from your budget context.",
  }));
}

function fallbackResponse(question: string): AiPlannerResponse {
  const answer = [
    "I can help even offline.",
    `For your request "${question}", prioritize one paid activity and two low-cost spots nearby.`,
    "Keep a 20% safety margin on your daily activity budget.",
    "- Local walking loop with street food stop",
    "- Museum or gallery during discount hours",
    "- Sunset viewpoint reachable by public transport",
  ].join("\n");

  return {
    answer,
    activities: parseActivities(answer),
  };
}

export class RemoteLlmProvider implements LlmProviderPort {
  async generatePlan(
    params: Parameters<LlmProviderPort["generatePlan"]>[0],
  ): Promise<AiPlannerResponse> {
    const { settings, messages } = params;
    const userQuestion = messages[messages.length - 1]?.content ?? "";

    if (!settings.apiKey || settings.provider === "none") {
      return fallbackResponse(userQuestion);
    }

    try {
      const answer = await this.callProvider(settings.provider, settings.model, settings.apiKey, messages);
      return {
        answer,
        activities: parseActivities(answer),
      };
    } catch {
      return fallbackResponse(userQuestion);
    }
  }

  private async callProvider(
    provider: LlmProviderKind,
    model: string,
    apiKey: string,
    messages: AiPlannerMessage[],
  ): Promise<string> {
    if (provider === "openai") {
      return this.callOpenAi(model || "gpt-4o-mini", apiKey, messages);
    }

    if (provider === "mistral") {
      return this.callMistral(model || "mistral-small-latest", apiKey, messages);
    }

    if (provider === "claude") {
      return this.callClaude(model || "claude-3-5-sonnet-latest", apiKey, messages);
    }

    throw new Error("Unsupported provider");
  }

  private async callOpenAi(
    model: string,
    apiKey: string,
    messages: AiPlannerMessage[],
  ): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status})`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return json.choices?.[0]?.message?.content ?? "No answer from model.";
  }

  private async callMistral(
    model: string,
    apiKey: string,
    messages: AiPlannerMessage[],
  ): Promise<string> {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral request failed (${response.status})`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return json.choices?.[0]?.message?.content ?? "No answer from model.";
  }

  private async callClaude(
    model: string,
    apiKey: string,
    messages: AiPlannerMessage[],
  ): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        messages: [{ role: "user", content: messagesToText(messages) }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude request failed (${response.status})`);
    }

    const json = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    return (
      json.content
        ?.filter((chunk) => chunk.type === "text")
        .map((chunk) => chunk.text ?? "")
        .join("\n") ?? "No answer from model."
    );
  }
}
