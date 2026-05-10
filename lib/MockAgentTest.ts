import type { AgentEventType } from "./AgentService";

type EmitFn = (
  eventType: AgentEventType | "message",
  payload: unknown,
  timestamp?: string,
  id?: string,
) => void;

type StartReturn = { stop: () => void };

type MockAgentTestOptions = {
  delayMs?: number;
  speed?: number;
};

const DEFAULT_DELAY_MS = 180;

const makeIso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
const hasKeyword = (input: string, keywords: string[]) =>
  keywords.some((keyword) => new RegExp(`\\b${keyword}\\b`, "i").test(input));

export class MockAgentTest {
  private delayMs: number;
  private speed: number;

  constructor(options: MockAgentTestOptions = {}) {
    this.delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
    this.speed = options.speed ?? 1;
  }

  start(
    input: string,
    onEvent: EmitFn,
    onEnd: () => void,
    onError: (error: Error) => void,
  ): StartReturn {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let stopped = false;

    const schedule = (
      step: number,
      fn: () => void,
      mode: "continue" | "end" | "error" = "continue",
    ) => {
      const timer = setTimeout(() => {
        if (stopped) return;
        try {
          fn();
          if (mode === "end") {
            stopped = true;
            onEnd();
          } else if (mode === "error") {
            throw new Error("Mock stream forced error");
          }
        } catch (error) {
          stopped = true;
          onError(error instanceof Error ? error : new Error(String(error)));
        } finally {
          timers.delete(timer);
        }
      }, Math.round(step * this.delayMs * this.speed));
      timers.add(timer);
    };

    const ids = {
      turnId: "mock-turn-1",
      reasoningId: "mock-reasoning-1",
      assistantMessageId: "mock-assistant-message-1",
      toolCallId: "mock-tool-1",
      permissionReqId: "mock-permission-1",
      commandReqId: "mock-command-1",
    };

    let step = 1;
    const emit = (
      eventType: AgentEventType | "message",
      payload: unknown,
      eventId?: string,
    ) => {
      const timestamp = makeIso(step * this.delayMs);
      schedule(step, () => onEvent(eventType, payload, timestamp, eventId));
      step += 1;
    };

    const normalizedInput = input.trim();
    const responseContent = `Working on ${normalizedInput}`;

    const finalMessage = () => {
      emit("assistant.message", {
        messageId: ids.assistantMessageId,
        content: responseContent,
        outputTokens: 42,
        phase: "complete",
        interactionId: "mock-interaction-1",
      });
    };

    const emitToolFlow = () => {
      emit("assistant.intent", { intent: "Run tool flow" });
      emit("tool.user_requested", {
        toolCallId: ids.toolCallId,
        toolName: "mock_search",
        arguments: { query: normalizedInput },
      });
      emit("tool.execution_start", {
        toolCallId: ids.toolCallId,
        toolName: "mock_search",
        arguments: { query: normalizedInput },
        mcpServerName: "mock",
        mcpToolName: "search",
      });
      emit("tool.execution_progress", {
        toolCallId: ids.toolCallId,
        progressMessage: "Running mock tool...",
      });
      emit("tool.execution_partial_result", {
        toolCallId: ids.toolCallId,
        partialOutput: "Mock partial results available",
      });
      emit("tool.execution_complete", {
        toolCallId: ids.toolCallId,
        success: true,
        model: "gpt-mock",
        interactionId: "mock-interaction-1",
        isUserRequested: true,
        result: { content: "Mock tool execution complete" },
        toolTelemetry: { durationMs: 120 },
      });
      finalMessage();
    };

    const emitReasoningFlow = () => {
      emit("assistant.intent", { intent: "Show reasoning flow" });
      emit("assistant.reasoning_delta", {
        reasoningId: ids.reasoningId,
        deltaContent: "Thinking through the request. ",
      });
      emit("assistant.reasoning_delta", {
        reasoningId: ids.reasoningId,
        deltaContent: "Planning the response. ",
      });
      emit("assistant.reasoning", {
        reasoningId: ids.reasoningId,
        content: "Reasoning complete.",
      });
      finalMessage();
    };

    const emitPermissionFlow = () => {
      emit("assistant.intent", { intent: "Request permission flow" });
      emit("permission.requested", {
        requestId: ids.permissionReqId,
        permissionRequest: { kind: "shell", command: normalizedInput },
      });
      emit("permission.completed", {
        requestId: ids.permissionReqId,
        result: { kind: "approved" },
      });
      finalMessage();
    };

    const emitCommandFlow = () => {
      emit("assistant.intent", { intent: "Run command flow" });
      emit("command.queued", {
        requestId: ids.commandReqId,
        command: normalizedInput,
      });
      emit("command.completed", { requestId: ids.commandReqId });
      finalMessage();
    };

    const emitDefaultFlow = () => {
      emit("assistant.intent", { intent: "Direct response flow" });
      finalMessage();
    };

    emit("assistant.turn_start", {
      turnId: ids.turnId,
      interactionId: "mock-interaction-1",
    });

    if (hasKeyword(normalizedInput, ["tool", "find", "update"])) {
      emitToolFlow();
    } else if (hasKeyword(normalizedInput, ["think", "reason"])) {
      emitReasoningFlow();
    } else if (hasKeyword(normalizedInput, ["delete", "stop"])) {
      emitPermissionFlow();
    } else if (hasKeyword(normalizedInput, ["bash", "run"])) {
      emitCommandFlow();
    } else {
      emitDefaultFlow();
    }

    emit("assistant.turn_end", { turnId: ids.turnId });
    schedule(step, () => onEvent("session.idle", { backgroundTasks: {} }), "end");

    return {
      stop: () => {
        if (stopped) return;
        stopped = true;
        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();
      },
    };
  }
}
