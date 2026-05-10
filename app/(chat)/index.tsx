import { Composer } from "@/components/chat/composer";
import { EventTranscript } from "@/components/chat/event-transcript";
import type { BadgeProps } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  AgentService,
  type AgentEvent,
  type AgentEventType,
  type RenderItem,
} from "@/lib/AgentService";
import { MockAgentTest } from "@/lib/MockAgentTest";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventSource from "react-native-sse";

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

const LOG_TRUNCATE_LIMIT = 280;
type StreamMode = "real" | "mock";
type ActiveStreamHandle = { stop: () => void } | null;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<RenderItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [timelineMode, setTimelineMode] = useState(false);
  const [streamMode, setStreamMode] = useState<StreamMode>(
    __DEV__ ? "mock" : "real",
  );
  const agentServiceRef = useRef<AgentService | null>(null);
  const mockAgentRef = useRef<MockAgentTest | null>(null);
  const activeStreamRef = useRef<ActiveStreamHandle>(null);
  const legacyMessageIdRef = useRef<string | null>(null);
  const trimmedInput = input.trim();
  const statusLabel = hasError ? "Error" : isStreaming ? "Streaming" : "Ready";
  const statusVariant: BadgeProps["variant"] = hasError
    ? "destructive"
    : isStreaming
      ? "default"
      : "secondary";

  const eventTypes = useMemo(() => STREAM_EVENT_TYPES, []);

  const agentService = useMemo(() => {
    if (!agentServiceRef.current) {
      agentServiceRef.current = new AgentService();
    }
    return agentServiceRef.current;
  }, []);

  useEffect(() => agentService.subscribe(setItems), [agentService]);
  useEffect(
    () => () => {
      activeStreamRef.current?.stop();
      activeStreamRef.current = null;
    },
    [],
  );

  const stopActiveStream = () => {
    activeStreamRef.current?.stop();
    activeStreamRef.current = null;
  };

  const updateStatus = (event: AgentEvent) => {
    switch (event.type) {
      case "assistant.turn_start":
        setIsStreaming(true);
        setHasError(false);
        break;
      case "assistant.turn_end":
      case "session.idle":
        setIsStreaming(false);
        break;
      case "session.error":
        setIsStreaming(false);
        setHasError(true);
        break;
      default:
        break;
    }
  };

  const coerceEvent = (
    eventType: string,
    payload: Record<string, unknown>,
    timestamp?: string,
    id?: string,
  ): AgentEvent | null => {
    if (!STREAM_EVENT_TYPES.includes(eventType)) return null;
    return {
      id: id ?? makeId(),
      timestamp: timestamp ?? new Date().toISOString(),
      parentId: null,
      type: eventType as AgentEventType,
      data: payload as never,
    } as AgentEvent;
  };

  const parseEvent = (eventType: string, data: string) => {
    if (!data) return;

    const truncateLogValue = (value: string, limit = LOG_TRUNCATE_LIMIT) =>
      value.length > limit ? `${value.slice(0, limit)}...` : value;
    const logIncomingEvent = (type: string, payload: unknown) => {
      let serialized = "";
      try {
        serialized = JSON.stringify(payload);
      } catch {
        serialized = String(payload);
      }
      console.log(
        `[SSE EVENT] ${type}`,
        truncateLogValue(serialized || String(payload)),
      );
    };

    let parsed: {
      type?: string;
      data?: Record<string, unknown>;
      timestamp?: string;
      id?: string;
      parentId?: string | null;
    } | null = null;
    try {
      const value = JSON.parse(data) as {
        type?: string;
        data?: Record<string, unknown>;
        timestamp?: string;
        id?: string;
        parentId?: string | null;
      };
      if (value && typeof value.type === "string" && value.data) {
        parsed = value;
      }
    } catch {
      parsed = null;
    }

    if (parsed) {
      logIncomingEvent(parsed.type ?? eventType, parsed.data ?? {});
      const event = coerceEvent(
        parsed.type ?? eventType,
        parsed.data ?? {},
        parsed.timestamp,
        parsed.id,
      );
      if (event) {
        updateStatus(event);
        agentService.ingest(event);
      }
      return;
    }

    if (eventType !== "message") {
      let payload: Record<string, unknown> = { raw: data };
      try {
        payload = JSON.parse(data) as Record<string, unknown>;
      } catch {
        payload = { raw: data };
      }
      logIncomingEvent(eventType, payload);
      const event = coerceEvent(eventType, payload);
      if (event) {
        updateStatus(event);
        agentService.ingest(event);
      }
      return;
    }

    const fallbackMessageId =
      legacyMessageIdRef.current ?? `legacy-${Date.now()}`;
    legacyMessageIdRef.current = fallbackMessageId;
    logIncomingEvent("assistant.message_delta", {
      messageId: fallbackMessageId,
      deltaContent: data,
    });
    const event = coerceEvent("assistant.message_delta", {
      messageId: fallbackMessageId,
      deltaContent: data,
    });
    if (event) {
      updateStatus(event);
      agentService.ingest(event);
    }
  };

  const emitIncomingEvent = (
    eventType: AgentEventType | "message",
    payload: unknown,
    timestamp?: string,
    id?: string,
  ) => {
    if (eventType === "message") {
      const data =
        typeof payload === "string" ? payload : JSON.stringify(payload ?? {});
      parseEvent("message", data);
      return;
    }

    parseEvent(
      eventType,
      JSON.stringify({
        id: id ?? makeId(),
        timestamp: timestamp ?? new Date().toISOString(),
        type: eventType,
        data:
          typeof payload === "object" && payload !== null
            ? payload
            : { value: payload },
      }),
    );
  };

  const startMockStream = (userInput: string) => {
    if (!mockAgentRef.current) {
      mockAgentRef.current = new MockAgentTest();
    }
    const mockHandle = mockAgentRef.current.start(
      userInput,
      (eventType, payload, timestamp, id) =>
        emitIncomingEvent(eventType, payload, timestamp, id),
      () => {
        stopActiveStream();
        setIsStreaming(false);
      },
      (error) => {
        console.error("Mock Stream Error:", error);
        stopActiveStream();
        setIsStreaming(false);
        setHasError(true);
        const errorEvent = coerceEvent("session.error", {
          errorType: "mock_streaming",
          message: error.message || "Mock stream error",
        });
        if (errorEvent) {
          updateStatus(errorEvent);
          agentService.ingest(errorEvent);
        }
      },
    );
    activeStreamRef.current = { stop: mockHandle.stop };
  };

  const startRealStream = (userInput: string) => {
    // IMPORTANT: Replace with your actual VPS IP or your local IP if testing locally (e.g., 'http://192.168.1.X:3000')
    const url = "http://10.81.100.56:3000/api/chat";
    const es = new EventSource(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userInput,
        sessionId: "test-session",
      }),
    });

    activeStreamRef.current = {
      stop: () => {
        es.close();
      },
    };

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

    es.addEventListener("end" as never, () => {
      stopActiveStream();
      setIsStreaming(false);
    });

    es.addEventListener("error", (err) => {
      console.error("SSE Connection Error:", err);
      stopActiveStream();
      setIsStreaming(false);
      setHasError(true);
      const errorEvent = coerceEvent("session.error", {
        errorType: "streaming",
        message: "Stream error",
      });
      if (errorEvent) {
        updateStatus(errorEvent);
        agentService.ingest(errorEvent);
      }
    });
  };

  const sendMessage = () => {
    if (!trimmedInput || isStreaming) return;

    stopActiveStream();
    setHasError(false);
    setIsStreaming(true);
    const timestamp = Date.now();
    legacyMessageIdRef.current = makeId();

    const userEvent = coerceEvent(
      "user.message",
      {
        content: trimmedInput,
        source: "user",
      },
      new Date(timestamp).toISOString(),
    );
    if (userEvent) {
      updateStatus(userEvent);
      agentService.ingest(userEvent);
    }

    if (streamMode === "mock") {
      startMockStream(trimmedInput);
    } else {
      startRealStream(trimmedInput);
    }

    setInput("");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="flex-1 px-4 pb-2 pt-2">
        <View className="gap-3 rounded-2xl border border-border/40 bg-muted/20 px-3 py-3">
          <View className="flex-row items-center justify-between gap-2">
            <Link href="/(root)/(tabs)/home" asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Text>Back</Text>
              </Button>
            </Link>
            <Badge variant={statusVariant}>
              <Text>{statusLabel}</Text>
            </Badge>
          </View>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-2xl font-semibold" numberOfLines={1}>
              Remote Agent UI
            </Text>
            <View className="flex-row flex-wrap items-center justify-end gap-2">
              <Button
                variant={streamMode === "mock" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 min-w-24 rounded-full px-3"
                onPress={() =>
                  setStreamMode((mode) => (mode === "mock" ? "real" : "mock"))
                }
                disabled={isStreaming}
              >
                <Text numberOfLines={1}>
                  {streamMode === "mock" ? "Mock" : "Real"}
                </Text>
              </Button>
              <Button
                variant={timelineMode ? "secondary" : "ghost"}
                size="sm"
                className="h-8 min-w-24 rounded-full px-3"
                onPress={() => setTimelineMode((value) => !value)}
              >
                <Text numberOfLines={1}>{timelineMode ? "Timeline" : "Default"}</Text>
              </Button>
            </View>
          </View>
        </View>
        <View className="flex-1 gap-3 pt-3">
          <EventTranscript
            items={items}
            mode={timelineMode ? "timeline" : "default"}
            compact
          />
          <Composer
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            disabled={isStreaming}
            canSend={trimmedInput.length > 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
