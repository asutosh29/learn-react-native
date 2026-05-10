import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import {
  Bot,
  Brain,
  CircleHelp,
  Cog,
  Command,
  OctagonAlert,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react-native";

type BaseCardProps = {
  title: string;
  content?: string;
  meta?: string;
  status?: "streaming" | "done" | "error";
  kind?: string;
  collapsedMetaByDefault?: boolean;
};

type PlaceholderCardProps = {
  title: string;
  description: string;
  kind?: string;
};

const statusText: Record<NonNullable<BaseCardProps["status"]>, string> = {
  streaming: "In progress",
  done: "Complete",
  error: "Error",
};

const kindConfig = {
  "assistant-message": {
    label: "Assistant",
    icon: Bot,
    tone: "text-sky-700",
    card: "border-sky-500/30 bg-sky-500/5",
  },
  "user-message": {
    label: "User",
    icon: UserRound,
    tone: "text-violet-700",
    card: "border-violet-500/30 bg-violet-500/5",
  },
  "system-message": {
    label: "System",
    icon: Command,
    tone: "text-zinc-700",
    card: "border-zinc-500/30 bg-zinc-500/5",
  },
  "assistant-reasoning": {
    label: "Reasoning",
    icon: Brain,
    tone: "text-amber-700",
    card: "border-amber-500/30 bg-amber-500/5",
  },
  tool: {
    label: "Tool",
    icon: Wrench,
    tone: "text-emerald-700",
    card: "border-emerald-500/30 bg-emerald-500/5",
  },
  command: {
    label: "Command",
    icon: Cog,
    tone: "text-cyan-700",
    card: "border-cyan-500/30 bg-cyan-500/5",
  },
  permission: {
    label: "Permission",
    icon: ShieldCheck,
    tone: "text-indigo-700",
    card: "border-indigo-500/30 bg-indigo-500/5",
  },
  abort: {
    label: "Abort",
    icon: OctagonAlert,
    tone: "text-rose-700",
    card: "border-rose-500/30 bg-rose-500/10",
  },
  default: {
    label: "Event",
    icon: CircleHelp,
    tone: "text-muted-foreground",
    card: "border-border/40 bg-card",
  },
} as const;

const getKindConfig = (kind?: string) =>
  kind && kind in kindConfig
    ? kindConfig[kind as keyof typeof kindConfig]
    : kindConfig.default;

function CardHeader({
  title,
  status,
  kind,
}: {
  title: string;
  status?: BaseCardProps["status"];
  kind?: string;
}) {
  const config = getKindConfig(kind);
  return (
    <View className="min-h-6 flex-row items-center justify-between gap-2">
      <View className="min-w-0 flex-1 flex-row items-center gap-2 pr-1">
        <Icon as={config.icon} className={cn("size-3.5", config.tone)} />
        <Text className="shrink text-xs text-muted-foreground" numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <Badge variant="outline" className="border-border/40 bg-background/40 px-1.5 py-0">
          <Text className={cn("text-[10px]", config.tone)}>{config.label}</Text>
        </Badge>
        {status ? (
          <Text className="text-xs text-muted-foreground">{statusText[status]}</Text>
        ) : null}
      </View>
    </View>
  );
}

function MetaText({
  meta,
  collapsedMetaByDefault,
}: {
  meta?: string;
  collapsedMetaByDefault?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!meta) return null;
  const collapsible = collapsedMetaByDefault ?? true;
  if (!collapsible) {
    return <Text className="mt-2 text-xs text-muted-foreground">{meta}</Text>;
  }
  const shouldClamp = !expanded && meta.length > 80;
  return (
    <Pressable onPress={() => setExpanded((value) => !value)} className="mt-2">
      <Text
        className="text-xs text-muted-foreground"
        numberOfLines={shouldClamp ? 1 : undefined}
      >
        {meta}
      </Text>
      {meta.length > 80 ? (
        <Text className="mt-1 text-[11px] text-muted-foreground/80">
          {expanded ? "Show less" : "More"}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function PlaceholderCard({
  title,
  description,
  kind,
}: PlaceholderCardProps) {
  const config = getKindConfig(kind);
  return (
    <View className={cn("rounded-2xl border px-4 py-3", config.card)}>
      <CardHeader title={title} kind={kind} />
      <Text className="text-sm font-medium text-foreground/80">
        {description}
      </Text>
    </View>
  );
}

export function EventCard({
  title,
  content,
  meta,
  status,
  kind,
  collapsedMetaByDefault,
}: BaseCardProps) {
  const config = getKindConfig(kind);
  return (
    <View className={cn("rounded-2xl border px-4 py-3", config.card)}>
      <CardHeader title={title} status={status} kind={kind} />
      {content ? (
        <Text className="mt-2 text-sm leading-6 text-foreground">
          {content}
        </Text>
      ) : null}
      <MetaText
        meta={meta}
        collapsedMetaByDefault={collapsedMetaByDefault}
      />
    </View>
  );
}

export function ReasoningBlock({
  title,
  content,
  meta,
  kind,
  collapsedMetaByDefault,
}: BaseCardProps) {
  const config = getKindConfig(kind);
  return (
    <View className={cn("rounded-2xl border px-4 py-3", config.card)}>
      <CardHeader title={title} kind={kind} />
      {content ? (
        <Text className="mt-2 text-sm leading-6 text-foreground">
          {content}
        </Text>
      ) : null}
      <MetaText
        meta={meta}
        collapsedMetaByDefault={collapsedMetaByDefault}
      />
    </View>
  );
}

export function ToolBlock({
  title,
  content,
  meta,
  status,
  kind,
  collapsedMetaByDefault,
}: BaseCardProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-border/50 px-4 py-3",
        status === "error" ? "bg-destructive/10" : "bg-secondary/20",
      )}
    >
      <CardHeader title={title} status={status} kind={kind} />
      {content ? (
        <Text className="mt-2 text-sm leading-6 text-foreground">
          {content}
        </Text>
      ) : null}
      <MetaText
        meta={meta}
        collapsedMetaByDefault={collapsedMetaByDefault}
      />
    </View>
  );
}
