import type { RenderItem, RenderItemKind } from "@/lib/AgentService";
import React from "react";
import {
    EventCard,
    PlaceholderCard,
    ReasoningBlock,
    ToolBlock,
} from "./event-cards";
import { MessageBubble } from "./message-bubble";

type MessageRole = "user" | "assistant" | "system";

type EventRendererProps = {
  item: RenderItem;
  collapsedMetaByDefault?: boolean;
};

const toRole = (kind: RenderItemKind): MessageRole => {
  if (kind === "assistant-message") return "assistant";
  if (kind === "user-message") return "user";
  return "system";
};

const toStatus = (
  status: RenderItem["status"],
): MessageBubbleProps["status"] => {
  if (status === "final") return "done";
  if (status === "error") return "error";
  return "streaming";
};

type MessageBubbleProps = React.ComponentProps<typeof MessageBubble>;

const toTimestamp = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const truncate = (value: string, limit = 700) =>
  value.length > limit ? `${value.slice(0, limit)}...` : value;

const formatMeta = (value: unknown) => {
  if (!value) return undefined;
  try {
    return truncate(JSON.stringify(value));
  } catch {
    return truncate(String(value));
  }
};

const placeholderText: Partial<Record<RenderItemKind, string>> = {
  "assistant-message": "Assistant is typing...",
  "assistant-reasoning": "Reasoning in progress...",
  tool: "Tool running...",
  permission: "Awaiting permission...",
  "user-input": "Awaiting user input...",
  elicitation: "Awaiting form input...",
  command: "Command running...",
  "external-tool": "External tool running...",
};

export function EventRenderer({
  item,
  collapsedMetaByDefault = true,
}: EventRendererProps) {
  const role = toRole(item.kind);
  const status = toStatus(item.status);
  const title = item.title ?? item.eventType;
  const meta = formatMeta(item.metadata);
  const content = item.content ?? "";

  if (item.phase === "placeholder") {
    return (
      <PlaceholderCard
        title={title}
        description={placeholderText[item.kind] ?? "Working..."}
        kind={item.kind}
      />
    );
  }

  if (
    item.kind === "assistant-message" ||
    item.kind === "user-message" ||
    item.kind === "system-message"
  ) {
    return (
      <MessageBubble
        role={role}
        content={content}
        timestamp={toTimestamp(item.timestamp)}
        status={status}
        title={title}
        meta={meta}
      />
    );
  }

  if (item.kind === "assistant-reasoning") {
    return (
      <ReasoningBlock
        title={title}
        content={content}
        meta={meta}
        kind={item.kind}
        collapsedMetaByDefault={collapsedMetaByDefault}
      />
    );
  }

  if (item.kind === "tool") {
    return (
      <ToolBlock
        title={title}
        content={content}
        meta={meta}
        status={status}
        kind={item.kind}
        collapsedMetaByDefault={collapsedMetaByDefault}
      />
    );
  }

  return (
    <EventCard
      title={title}
      content={content}
      meta={meta}
      status={status}
      kind={item.kind}
      collapsedMetaByDefault={collapsedMetaByDefault}
    />
  );
}
