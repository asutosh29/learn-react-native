import { ChatHeader } from "@/components/chat/chat-header";
import { ChatTranscript } from "@/components/chat/chat-transcript";
import { Composer } from "@/components/chat/composer";
import type { BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Link } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import EventSource from "react-native-sse";

type MessageRole = "user" | "assistant" | "system";

type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: "streaming" | "done" | "error";
  title?: string;
  meta?: string;
};

type StreamEventEnvelope = {
  id: string;
  timestamp: string;
  parentId?: string | null;
  ephemeral?: boolean;
  type: string;
  data: Record<string, unknown>;
};

const STREAM_EVENT_TYPES = [
  "assistant.turn_start",
  "assistant.intent",
  "assistant.reasoning",
  "assistant.reasoning_delta",
  "assistant.streaming_delta",
  "assistant.message",
  "assistant.message_delta",
  "assistant.turn_end",
  "assistant.usage",
  "tool.user_requested",
  "tool.execution_start",
  "tool.execution_partial_result",
  "tool.execution_progress",
  "tool.execution_complete",
  "session.idle",
  "session.error",
  "session.compaction_start",
  "session.compaction_complete",
  "session.title_changed",
  "session.context_changed",
  "session.usage_info",
  "session.task_complete",
  "session.shutdown",
  "permission.requested",
  "permission.completed",
  "user_input.requested",
  "user_input.completed",
  "elicitation.requested",
  "elicitation.completed",
  "subagent.started",
  "subagent.completed",
  "subagent.failed",
  "subagent.selected",
  "subagent.deselected",
  "skill.invoked",
  "abort",
  "user.message",
  "system.message",
  "external_tool.requested",
  "external_tool.completed",
  "exit_plan_mode.requested",
  "exit_plan_mode.completed",
  "command.queued",
  "command.completed",
];

const EPHEMERAL_EVENT_TYPES = new Set([
  "assistant.intent",
  "assistant.reasoning_delta",
  "assistant.message_delta",
  "assistant.streaming_delta",
  "assistant.usage",
  "tool.execution_partial_result",
  "tool.execution_progress",
  "session.idle",
  "session.title_changed",
  "session.usage_info",
  "permission.requested",
  "permission.completed",
  "user_input.requested",
  "user_input.completed",
  "elicitation.requested",
  "elicitation.completed",
  "external_tool.requested",
  "external_tool.completed",
  "exit_plan_mode.requested",
  "exit_plan_mode.completed",
  "command.queued",
  "command.completed",
]);

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const assistantMessageMap = useRef(new Map<string, string>());
  const reasoningMessageMap = useRef(new Map<string, string>());
  const reasoningContentMap = useRef(new Map<string, string>());
  const toolCallNameMap = useRef(new Map<string, string>());
  const toolOutputMap = useRef(new Map<string, string>());
  const eventMessageMap = useRef(new Map<string, string>());
  const legacyMessageIdRef = useRef<string | null>(null);
  const trimmedInput = input.trim();
  const statusLabel = hasError ? "Error" : isStreaming ? "Streaming" : "Ready";
  const statusVariant: BadgeProps["variant"] = hasError
    ? "destructive"
    : isStreaming
      ? "default"
      : "secondary";

  const eventTypes = useMemo(() => STREAM_EVENT_TYPES, []);

  const toTimestamp = (timestamp: string | number) => {
    if (typeof timestamp === "number") return timestamp;
    const parsed = Date.parse(timestamp);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  };

  const truncate = (value: string, limit = 600) =>
    value.length > limit ? `${value.slice(0, limit)}...` : value;

  const formatJson = (value: unknown) => {
    if (!value) return "";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const upsertEventMessage = (key: string, message: Message) => {
    setMessages((prev) => {
      const existingId = eventMessageMap.current.get(key);
      if (!existingId) {
        eventMessageMap.current.set(key, message.id);
        return [...prev, message];
      }
      return prev.map((item) =>
        item.id === existingId
          ? {
              ...item,
              content: message.content,
              timestamp: message.timestamp,
              status: message.status,
              title: message.title,
              meta: message.meta,
            }
          : item,
      );
    });
  };

  const handleAssistantDelta = (messageId: string, delta: string) => {
    const localId = assistantMessageMap.current.get(messageId) ?? makeId();
    assistantMessageMap.current.set(messageId, localId);
    setMessages((prev) =>
      prev.map((message) =>
        message.id === localId
          ? {
              ...message,
              content: message.content + delta,
              status: "streaming",
              timestamp: Date.now(),
            }
          : message,
      ),
    );
  };

  const ensureAssistantMessage = (messageId: string, timestamp: number) => {
    const localId = assistantMessageMap.current.get(messageId);
    if (localId) return localId;
    const newId = makeId();
    assistantMessageMap.current.set(messageId, newId);
    setMessages((prev) => [
      ...prev,
      {
        id: newId,
        role: "assistant",
        content: "",
        timestamp,
        status: "streaming",
      },
    ]);
    return newId;
  };

  const handleStreamEvent = (event: StreamEventEnvelope) => {
    const timestamp = toTimestamp(event.timestamp);
    const isEphemeral =
      event.ephemeral ?? EPHEMERAL_EVENT_TYPES.has(event.type);
    const baseMessage: Message = {
      id: `event-${event.id}`,
      role: "system" as const,
      timestamp,
      status: isEphemeral ? "streaming" : "done",
      title: event.type,
      meta: isEphemeral ? "ephemeral" : undefined,
      content: "",
    };

    switch (event.type) {
      case "assistant.message_delta": {
        const messageId = String(event.data.messageId ?? "");
        const delta = String(event.data.deltaContent ?? "");
        if (!messageId || !delta) return;
        ensureAssistantMessage(messageId, timestamp);
        handleAssistantDelta(messageId, delta);
        return;
      }
      case "assistant.message": {
        const messageId = String(event.data.messageId ?? "");
        const content = String(event.data.content ?? "");
        if (messageId) {
          const localId = ensureAssistantMessage(messageId, timestamp);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === localId
                ? { ...message, content, status: "done", timestamp }
                : message,
            ),
          );
        }
        if (event.data.toolRequests) {
          const toolRequests = formatJson(event.data.toolRequests);
          if (toolRequests) {
            upsertEventMessage(`toolRequests:${event.id}`, {
              ...baseMessage,
              content: truncate(`Tool requests:\n${toolRequests}`),
            });
          }
        }
        return;
      }
      case "assistant.reasoning_delta": {
        const reasoningId = String(event.data.reasoningId ?? "");
        const delta = String(event.data.deltaContent ?? "");
        if (!reasoningId || !delta) return;
        const nextContent = `${reasoningContentMap.current.get(reasoningId) ?? ""}${delta}`;
        reasoningContentMap.current.set(reasoningId, nextContent);
        const localId =
          reasoningMessageMap.current.get(reasoningId) ?? makeId();
        reasoningMessageMap.current.set(reasoningId, localId);
        upsertEventMessage(`reasoning:${reasoningId}`, {
          ...baseMessage,
          id: localId,
          content: truncate(nextContent),
          title: "assistant.reasoning_delta",
        });
        return;
      }
      case "assistant.reasoning": {
        const reasoningId = String(event.data.reasoningId ?? "");
        const content = String(event.data.content ?? "");
        if (!reasoningId) return;
        reasoningContentMap.current.set(reasoningId, content);
        upsertEventMessage(`reasoning:${reasoningId}`, {
          ...baseMessage,
          id: reasoningMessageMap.current.get(reasoningId) ?? makeId(),
          content: truncate(content),
          title: "assistant.reasoning",
          status: "done",
        });
        return;
      }
      case "tool.execution_start": {
        const toolCallId = String(event.data.toolCallId ?? "");
        const toolName = String(event.data.toolName ?? "tool");
        if (toolCallId) toolCallNameMap.current.set(toolCallId, toolName);
        upsertEventMessage(`tool:${toolCallId || event.id}`, {
          ...baseMessage,
          content: `Tool ${toolName} started.`,
        });
        return;
      }
      case "tool.execution_partial_result": {
        const toolCallId = String(event.data.toolCallId ?? "");
        const toolName = toolCallNameMap.current.get(toolCallId) ?? "tool";
        const partial = String(event.data.partialOutput ?? "");
        const nextContent = `${toolOutputMap.current.get(toolCallId) ?? ""}${partial}`;
        toolOutputMap.current.set(toolCallId, nextContent);
        upsertEventMessage(`tool:${toolCallId || event.id}`, {
          ...baseMessage,
          content: truncate(`Tool ${toolName} output:\n${nextContent}`),
        });
        return;
      }
      case "tool.execution_progress": {
        const toolCallId = String(event.data.toolCallId ?? "");
        const toolName = toolCallNameMap.current.get(toolCallId) ?? "tool";
        const progress = String(event.data.progressMessage ?? "");
        toolOutputMap.current.set(toolCallId, progress);
        upsertEventMessage(`tool:${toolCallId || event.id}`, {
          ...baseMessage,
          content: `Tool ${toolName}: ${progress}`,
        });
        return;
      }
      case "tool.execution_complete": {
        const toolCallId = String(event.data.toolCallId ?? "");
        const toolName = toolCallNameMap.current.get(toolCallId) ?? "tool";
        const success = Boolean(event.data.success);
        const result = event.data.result as Record<string, unknown> | undefined;
        const error = event.data.error as Record<string, unknown> | undefined;
        const content = success
          ? truncate(String(result?.detailedContent ?? result?.content ?? ""))
          : String(error?.message ?? "Unknown error");
        upsertEventMessage(`tool:${toolCallId || event.id}`, {
          ...baseMessage,
          content: success
            ? `Tool ${toolName} complete. ${content}`
            : `Tool ${toolName} failed: ${content}`,
          status: success ? "done" : "error",
        });
        return;
      }
      case "session.error": {
        setHasError(true);
        upsertEventMessage(`session.error:${event.id}`, {
          ...baseMessage,
          content: `Session error: ${String(event.data.message ?? "Unknown")}`,
        });
        return;
      }
      case "assistant.turn_start": {
        setIsStreaming(true);
        const turnId = String(event.data.turnId ?? "");
        upsertEventMessage(`assistant.turn:${turnId || event.id}`, {
          ...baseMessage,
          content: `Turn ${turnId || "started"} started.`,
        });
        return;
      }
      case "assistant.turn_end": {
        const turnId = String(event.data.turnId ?? "");
        upsertEventMessage(`assistant.turn:${turnId || event.id}`, {
          ...baseMessage,
          content: `Turn ${turnId || ""} ended.`,
          status: "done",
        });
        return;
      }
      case "session.idle": {
        setIsStreaming(false);
        upsertEventMessage(`session.idle:${event.id}`, {
          ...baseMessage,
          content: "Session idle.",
        });
        return;
      }
      default: {
        const dataText = formatJson(event.data);
        upsertEventMessage(`${event.type}:${event.id}`, {
          ...baseMessage,
          content: truncate(dataText || event.type),
        });
      }
    }
  };

  const parseEvent = (eventType: string, data: string) => {
    if (!data) return;
    let parsed: StreamEventEnvelope | null = null;
    try {
      const value = JSON.parse(data) as StreamEventEnvelope;
      if (value && typeof value.type === "string" && value.data) {
        parsed = value;
      }
    } catch {
      parsed = null;
    }

    if (parsed) {
      handleStreamEvent(parsed);
      return;
    }

    if (eventType !== "message") {
      let payload: Record<string, unknown> = { raw: data };
      try {
        payload = JSON.parse(data) as Record<string, unknown>;
      } catch {
        payload = { raw: data };
      }
      handleStreamEvent({
        id: makeId(),
        timestamp: new Date().toISOString(),
        type: eventType,
        data: payload,
        ephemeral: EPHEMERAL_EVENT_TYPES.has(eventType),
      });
      return;
    }

    const fallbackMessageId =
      legacyMessageIdRef.current ?? `legacy-${Date.now()}`;
    legacyMessageIdRef.current = fallbackMessageId;
    ensureAssistantMessage(fallbackMessageId, Date.now());
    handleAssistantDelta(fallbackMessageId, data);
  };

  const sendMessage = () => {
    if (!trimmedInput || isStreaming) return;

    setHasError(false);
    setIsStreaming(true);

    // IMPORTANT: Replace with your actual VPS IP or your local IP if testing locally (e.g., 'http://192.168.1.X:3000')
    const url = "http://10.81.100.56:3000/api/chat";
    const timestamp = Date.now();
    legacyMessageIdRef.current = makeId();

    const userMessage: Message = {
      id: makeId(),
      role: "user",
      content: trimmedInput,
      timestamp,
      status: "done",
    };

    setMessages((prev) => [...prev, userMessage]);

    const es = new EventSource(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: trimmedInput,
        sessionId: "test-session",
      }),
    });

    // Listen for text chunks
    es.addEventListener("message", (event) => {
      if (!event.data) return;
      parseEvent("message", event.data);
    });

    eventTypes.forEach((eventType) => {
      es.addEventListener(eventType as never, (event: any) => {
        if (!event?.data) return;
        parseEvent(eventType, event.data);
      });
    });

    // Listen for our custom 'end' event
    es.addEventListener("end" as never, () => {
      setIsStreaming(false);
      es.close();
    });

    // Handle errors
    es.addEventListener("error", (err) => {
      console.error("SSE Connection Error:", err);
      setIsStreaming(false);
      setHasError(true);
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i]?.role === "assistant") {
            next[i] = { ...next[i], status: "error" };
            break;
          }
        }
        return next;
      });
      es.close();
    });

    setInput("");
  };

  return (
    <View className="flex-1 bg-background px-5 pt-12">
      <View className="flex-1 gap-4">
        <Link href="/(root)/(tabs)/home" asChild>
          <Button variant="ghost" size="sm" className="self-start">
            <Text>Back to Home</Text>
          </Button>
        </Link>
        <ChatHeader
          title="Remote Agent UI"
          statusLabel={statusLabel}
          statusVariant={statusVariant}
        />
        <View className="flex-1 gap-4">
          <ChatTranscript messages={messages} />
          <Composer
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            disabled={isStreaming}
            canSend={trimmedInput.length > 0}
          />
        </View>
      </View>
    </View>
  );
}
