type EventEnvelope<TType extends AgentEventType, TData> = {
  id: string;
  timestamp: string;
  parentId: string | null;
  ephemeral?: boolean;
  type: TType;
  data: TData;
};

type ToolRequest = {
  toolCallId: string;
  name: string;
  arguments?: Record<string, unknown>;
  type?: "function" | "custom";
};

type PermissionRequest = {
  kind: "shell" | "write" | "read" | "mcp" | "url" | "memory" | "custom-tool";
  toolCallId?: string;
} & Record<string, unknown>;

type AgentEventType =
  | "assistant.turn_start"
  | "assistant.intent"
  | "assistant.reasoning"
  | "assistant.reasoning_delta"
  | "assistant.streaming_delta"
  | "assistant.message"
  | "assistant.message_delta"
  | "assistant.turn_end"
  | "assistant.usage"
  | "tool.user_requested"
  | "tool.execution_start"
  | "tool.execution_partial_result"
  | "tool.execution_progress"
  | "tool.execution_complete"
  | "session.idle"
  | "session.error"
  | "session.compaction_start"
  | "session.compaction_complete"
  | "session.title_changed"
  | "session.context_changed"
  | "session.usage_info"
  | "session.task_complete"
  | "session.shutdown"
  | "permission.requested"
  | "permission.completed"
  | "user_input.requested"
  | "user_input.completed"
  | "elicitation.requested"
  | "elicitation.completed"
  | "subagent.started"
  | "subagent.completed"
  | "subagent.failed"
  | "subagent.selected"
  | "subagent.deselected"
  | "skill.invoked"
  | "abort"
  | "user.message"
  | "system.message"
  | "external_tool.requested"
  | "external_tool.completed"
  | "command.queued"
  | "command.completed"
  | "exit_plan_mode.requested"
  | "exit_plan_mode.completed";

type EventDataMap = {
  "assistant.turn_start": { turnId: string; interactionId?: string };
  "assistant.intent": { intent: string };
  "assistant.reasoning": { reasoningId: string; content: string };
  "assistant.reasoning_delta": { reasoningId: string; deltaContent: string };
  "assistant.streaming_delta": { totalResponseSizeBytes: number };
  "assistant.message": {
    messageId: string;
    content: string;
    toolRequests?: ToolRequest[];
    reasoningOpaque?: string;
    reasoningText?: string;
    encryptedContent?: string;
    phase?: string;
    outputTokens?: number;
    interactionId?: string;
    parentToolCallId?: string;
  };
  "assistant.message_delta": {
    messageId: string;
    deltaContent: string;
    parentToolCallId?: string;
  };
  "assistant.turn_end": { turnId: string };
  "assistant.usage": {
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    cost?: number;
    duration?: number;
    initiator?: string;
    apiCallId?: string;
    providerCallId?: string;
    parentToolCallId?: string;
  };
  "tool.user_requested": {
    toolCallId: string;
    toolName: string;
    arguments?: Record<string, unknown>;
  };
  "tool.execution_start": {
    toolCallId: string;
    toolName: string;
    arguments?: Record<string, unknown>;
    mcpServerName?: string;
    mcpToolName?: string;
    parentToolCallId?: string;
  };
  "tool.execution_partial_result": {
    toolCallId: string;
    partialOutput: string;
  };
  "tool.execution_progress": { toolCallId: string; progressMessage: string };
  "tool.execution_complete": {
    toolCallId: string;
    success: boolean;
    model?: string;
    interactionId?: string;
    isUserRequested?: boolean;
    result?: {
      content: string;
      detailedContent?: string;
      contents?: Array<Record<string, unknown>>;
    };
    error?: { message: string; code?: string };
    toolTelemetry?: Record<string, unknown>;
    parentToolCallId?: string;
  };
  "session.idle": { backgroundTasks?: Record<string, unknown> };
  "session.error": {
    errorType: string;
    message: string;
    stack?: string;
    statusCode?: number;
    providerCallId?: string;
  };
  "session.compaction_start": Record<string, never>;
  "session.compaction_complete": {
    success: boolean;
    error?: string;
    preCompactionTokens?: number;
    postCompactionTokens?: number;
    preCompactionMessagesLength?: number;
    messagesRemoved?: number;
    tokensRemoved?: number;
    summaryContent?: string;
    checkpointNumber?: number;
    checkpointPath?: string;
    compactionTokensUsed?: Record<string, unknown>;
    requestId?: string;
  };
  "session.title_changed": { title: string };
  "session.context_changed": {
    cwd: string;
    gitRoot?: string;
    repository?: string;
    branch?: string;
  };
  "session.usage_info": {
    tokenLimit: number;
    currentTokens: number;
    messagesLength: number;
  };
  "session.task_complete": { summary?: string };
  "session.shutdown": {
    shutdownType: "routine" | "error";
    errorReason?: string;
    totalPremiumRequests: number;
    totalApiDurationMs: number;
    sessionStartTime: number;
    codeChanges: {
      linesAdded: number;
      linesRemoved: number;
      filesModified: number;
    };
    modelMetrics: Record<string, unknown>;
    currentModel?: string;
  };
  "permission.requested": {
    requestId: string;
    permissionRequest: PermissionRequest;
  };
  "permission.completed": { requestId: string; result: { kind: string } };
  "user_input.requested": {
    requestId: string;
    question: string;
    choices?: string[];
    allowFreeform?: boolean;
  };
  "user_input.completed": { requestId: string };
  "elicitation.requested": {
    requestId: string;
    message: string;
    mode: "form";
    requestedSchema: Record<string, unknown>;
  };
  "elicitation.completed": { requestId: string };
  "subagent.started": {
    toolCallId: string;
    agentName: string;
    agentDisplayName: string;
    agentDescription?: string;
  };
  "subagent.completed": {
    toolCallId: string;
    agentName: string;
    agentDisplayName: string;
  };
  "subagent.failed": {
    toolCallId: string;
    agentName: string;
    agentDisplayName: string;
    error: string;
  };
  "subagent.selected": {
    agentName: string;
    agentDisplayName: string;
    tools: string[] | null;
  };
  "subagent.deselected": Record<string, never>;
  "skill.invoked": {
    name: string;
    path: string;
    content: string;
    allowedTools?: string[];
    pluginName?: string;
    pluginVersion?: string;
  };
  abort: { reason: string };
  "user.message": {
    content: string;
    transformedContent?: string;
    attachments?: Array<Record<string, unknown>>;
    source?: string;
    agentMode?: string;
    interactionId?: string;
  };
  "system.message": {
    content: string;
    role: "system" | "developer";
    name?: string;
    metadata?: Record<string, unknown>;
  };
  "external_tool.requested": {
    requestId: string;
    sessionId: string;
    toolCallId: string;
    toolName: string;
    arguments?: Record<string, unknown>;
  };
  "external_tool.completed": { requestId: string };
  "command.queued": { requestId: string; command: string };
  "command.completed": { requestId: string };
  "exit_plan_mode.requested": {
    requestId: string;
    summary: string;
    planContent: string;
    actions: string[];
    recommendedAction?: string;
  };
  "exit_plan_mode.completed": { requestId: string };
};

type AgentEvent = {
  [K in AgentEventType]: EventEnvelope<K, EventDataMap[K]>;
}[AgentEventType];

type RenderItemStatus = "streaming" | "final" | "error";

type RenderItemPhase = "placeholder" | "final";

type RenderItemKind =
  | "assistant-message"
  | "assistant-reasoning"
  | "assistant-intent"
  | "assistant-usage"
  | "tool"
  | "permission"
  | "user-input"
  | "elicitation"
  | "session"
  | "user-message"
  | "system-message"
  | "subagent"
  | "skill"
  | "command"
  | "external-tool"
  | "abort"
  | "other";

type RenderItem = {
  id: string;
  kind: RenderItemKind;
  status: RenderItemStatus;
  phase: RenderItemPhase;
  title?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  eventType: AgentEventType;
  timestamp: string;
};

type Listener = (items: RenderItem[]) => void;

type State = {
  items: RenderItem[];
  itemsByKey: Map<string, RenderItem>;
};

const emptyState = (): State => ({
  items: [],
  itemsByKey: new Map(),
});

const makeKey = (kind: RenderItemKind, id: string) => `${kind}:${id}`;

export class AgentService {
  private state: State = emptyState();
  private listeners = new Set<Listener>();

  getItems(): RenderItem[] {
    return this.state.items;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state.items);
    return () => this.listeners.delete(listener);
  }

  ingest(event: AgentEvent): void {
    const handler = this.handlers[event.type] ?? this.handleUnknown;
    handler(event);
    this.emit();
  }

  private emit(): void {
    const items = [...this.state.items];
    this.listeners.forEach((listener) => listener(items));
  }

  private upsertItem(item: RenderItem): RenderItem {
    const key = makeKey(item.kind, item.id);
    const existing = this.state.itemsByKey.get(key);
    if (existing) {
      Object.assign(existing, item);
      return existing;
    }
    this.state.itemsByKey.set(key, item);
    this.state.items.push(item);
    return item;
  }

  private appendContent(item: RenderItem, delta: string): void {
    item.content = `${item.content ?? ""}${delta}`;
  }

  private handleUnknown = (event: AgentEvent): void => {
    this.upsertItem({
      id: event.id,
      kind: "other",
      status: "final",
      phase: "final",
      title: event.type,
      metadata: event.data as Record<string, unknown>,
      eventType: event.type,
      timestamp: event.timestamp,
    });
  };

  private handlers: Partial<
    Record<AgentEventType, (event: AgentEvent) => void>
  > = {
    "assistant.intent": (event) => {
      const data = event.data as EventDataMap["assistant.intent"];
      this.upsertItem({
        id: event.id,
        kind: "assistant-intent",
        status: "streaming",
        phase: "placeholder",
        title: "Intent",
        content: data.intent,
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    "assistant.reasoning_delta": (event) => {
      const data = event.data as EventDataMap["assistant.reasoning_delta"];
      const item = this.upsertItem({
        id: data.reasoningId,
        kind: "assistant-reasoning",
        status: "streaming",
        phase: "placeholder",
        title: "Reasoning",
        eventType: event.type,
        timestamp: event.timestamp,
      });
      this.appendContent(item, data.deltaContent);
    },
    "assistant.reasoning": (event) => {
      const data = event.data as EventDataMap["assistant.reasoning"];
      this.upsertItem({
        id: data.reasoningId,
        kind: "assistant-reasoning",
        status: "final",
        phase: "final",
        title: "Reasoning",
        content: data.content,
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    "assistant.message_delta": (event) => {
      const data = event.data as EventDataMap["assistant.message_delta"];
      const item = this.upsertItem({
        id: data.messageId,
        kind: "assistant-message",
        status: "streaming",
        phase: "placeholder",
        title: "Assistant",
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data.parentToolCallId
          ? { parentToolCallId: data.parentToolCallId }
          : undefined,
      });
      this.appendContent(item, data.deltaContent);
    },
    "assistant.message": (event) => {
      const data = event.data as EventDataMap["assistant.message"];
      this.upsertItem({
        id: data.messageId,
        kind: "assistant-message",
        status: "final",
        phase: "final",
        title: "Assistant",
        content: data.content,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: {
          toolRequests: data.toolRequests,
          parentToolCallId: data.parentToolCallId,
          outputTokens: data.outputTokens,
          phase: data.phase,
        },
      });
    },
    "assistant.usage": (event) => {
      const data = event.data as EventDataMap["assistant.usage"];
      this.upsertItem({
        id: event.id,
        kind: "assistant-usage",
        status: "final",
        phase: "final",
        title: "Usage",
        content: data.model,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data,
      });
    },
    "tool.execution_start": (event) => {
      const data = event.data as EventDataMap["tool.execution_start"];
      this.upsertItem({
        id: data.toolCallId,
        kind: "tool",
        status: "streaming",
        phase: "placeholder",
        title: data.toolName,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: {
          arguments: data.arguments,
          mcpServerName: data.mcpServerName,
          mcpToolName: data.mcpToolName,
          parentToolCallId: data.parentToolCallId,
        },
      });
    },
    "tool.execution_partial_result": (event) => {
      const data = event.data as EventDataMap["tool.execution_partial_result"];
      const item = this.upsertItem({
        id: data.toolCallId,
        kind: "tool",
        status: "streaming",
        phase: "placeholder",
        title: "Tool",
        eventType: event.type,
        timestamp: event.timestamp,
      });
      this.appendContent(item, data.partialOutput);
    },
    "tool.execution_progress": (event) => {
      const data = event.data as EventDataMap["tool.execution_progress"];
      this.upsertItem({
        id: data.toolCallId,
        kind: "tool",
        status: "streaming",
        phase: "placeholder",
        title: "Tool",
        content: data.progressMessage,
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    "tool.execution_complete": (event) => {
      const data = event.data as EventDataMap["tool.execution_complete"];
      this.upsertItem({
        id: data.toolCallId,
        kind: "tool",
        status: data.success ? "final" : "error",
        phase: "final",
        title: "Tool",
        content: data.success ? data.result?.content : data.error?.message,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data,
      });
    },
    "permission.requested": (event) => {
      const data = event.data as EventDataMap["permission.requested"];
      this.upsertItem({
        id: data.requestId,
        kind: "permission",
        status: "streaming",
        phase: "placeholder",
        title: "Permission",
        content: data.permissionRequest.kind,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data.permissionRequest,
      });
    },
    "permission.completed": (event) => {
      const data = event.data as EventDataMap["permission.completed"];
      this.upsertItem({
        id: data.requestId,
        kind: "permission",
        status: "final",
        phase: "final",
        title: "Permission",
        content: data.result.kind,
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    "user_input.requested": (event) => {
      const data = event.data as EventDataMap["user_input.requested"];
      this.upsertItem({
        id: data.requestId,
        kind: "user-input",
        status: "streaming",
        phase: "placeholder",
        title: "User Input",
        content: data.question,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: { choices: data.choices, allowFreeform: data.allowFreeform },
      });
    },
    "user_input.completed": (event) => {
      const data = event.data as EventDataMap["user_input.completed"];
      this.upsertItem({
        id: data.requestId,
        kind: "user-input",
        status: "final",
        phase: "final",
        title: "User Input",
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    "elicitation.requested": (event) => {
      const data = event.data as EventDataMap["elicitation.requested"];
      this.upsertItem({
        id: data.requestId,
        kind: "elicitation",
        status: "streaming",
        phase: "placeholder",
        title: "Elicitation",
        content: data.message,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data.requestedSchema,
      });
    },
    "elicitation.completed": (event) => {
      const data = event.data as EventDataMap["elicitation.completed"];
      this.upsertItem({
        id: data.requestId,
        kind: "elicitation",
        status: "final",
        phase: "final",
        title: "Elicitation",
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    "session.error": (event) => {
      const data = event.data as EventDataMap["session.error"];
      this.upsertItem({
        id: event.id,
        kind: "session",
        status: "error",
        phase: "final",
        title: "Session Error",
        content: data.message,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data,
      });
    },
    "session.title_changed": (event) => {
      const data = event.data as EventDataMap["session.title_changed"];
      this.upsertItem({
        id: event.id,
        kind: "session",
        status: "final",
        phase: "final",
        title: "Session Title",
        content: data.title,
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    "subagent.started": (event) => {
      const data = event.data as EventDataMap["subagent.started"];
      this.upsertItem({
        id: data.toolCallId,
        kind: "subagent",
        status: "streaming",
        phase: "placeholder",
        title: data.agentDisplayName,
        content: data.agentDescription,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data,
      });
    },
    "subagent.completed": (event) => {
      const data = event.data as EventDataMap["subagent.completed"];
      this.upsertItem({
        id: data.toolCallId,
        kind: "subagent",
        status: "final",
        phase: "final",
        title: data.agentDisplayName,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data,
      });
    },
    "subagent.failed": (event) => {
      const data = event.data as EventDataMap["subagent.failed"];
      this.upsertItem({
        id: data.toolCallId,
        kind: "subagent",
        status: "error",
        phase: "final",
        title: data.agentDisplayName,
        content: data.error,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data,
      });
    },
    "skill.invoked": (event) => {
      const data = event.data as EventDataMap["skill.invoked"];
      this.upsertItem({
        id: event.id,
        kind: "skill",
        status: "final",
        phase: "final",
        title: data.name,
        content: data.path,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data,
      });
    },
    "user.message": (event) => {
      const data = event.data as EventDataMap["user.message"];
      this.upsertItem({
        id: event.id,
        kind: "user-message",
        status: "final",
        phase: "final",
        title: "User",
        content: data.content,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data,
      });
    },
    "system.message": (event) => {
      const data = event.data as EventDataMap["system.message"];
      this.upsertItem({
        id: event.id,
        kind: "system-message",
        status: "final",
        phase: "final",
        title: data.role,
        content: data.content,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data,
      });
    },
    "command.queued": (event) => {
      const data = event.data as EventDataMap["command.queued"];
      this.upsertItem({
        id: data.requestId,
        kind: "command",
        status: "streaming",
        phase: "placeholder",
        title: "Command",
        content: data.command,
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    "command.completed": (event) => {
      const data = event.data as EventDataMap["command.completed"];
      this.upsertItem({
        id: data.requestId,
        kind: "command",
        status: "final",
        phase: "final",
        title: "Command",
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    "external_tool.requested": (event) => {
      const data = event.data as EventDataMap["external_tool.requested"];
      this.upsertItem({
        id: data.toolCallId,
        kind: "external-tool",
        status: "streaming",
        phase: "placeholder",
        title: data.toolName,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: data.arguments,
      });
    },
    "external_tool.completed": (event) => {
      const data = event.data as EventDataMap["external_tool.completed"];
      this.upsertItem({
        id: data.requestId,
        kind: "external-tool",
        status: "final",
        phase: "final",
        title: "External Tool",
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
    abort: (event) => {
      const data = event.data as EventDataMap["abort"];
      this.upsertItem({
        id: event.id,
        kind: "abort",
        status: "error",
        phase: "final",
        title: "Abort",
        content: data.reason,
        eventType: event.type,
        timestamp: event.timestamp,
      });
    },
  };
}

export type {
    AgentEvent,
    AgentEventType,
    RenderItem,
    RenderItemKind, RenderItemPhase, RenderItemStatus
};

