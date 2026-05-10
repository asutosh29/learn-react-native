import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import type { RenderItem, RenderItemKind } from "@/lib/AgentService";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { ScrollView, View } from "react-native";
import { EventRenderer } from "./event-renderer";

type MessageRole = "user" | "assistant" | "system";

type EventTranscriptProps = {
  items: RenderItem[];
  emptyText?: string;
  mode?: "default" | "timeline";
  compact?: boolean;
};

const toRole = (kind: RenderItemKind): MessageRole => {
  if (kind === "assistant-message") return "assistant";
  if (kind === "user-message") return "user";
  return "system";
};

export function EventTranscript({
  items,
  emptyText = "No messages yet.",
  mode = "default",
  compact = false,
}: EventTranscriptProps) {
  const scrollRef = useRef<ScrollView>(null);
  const contentStyle = { flexGrow: 1, justifyContent: "flex-end" as const };

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center rounded-3xl bg-muted/30 p-6">
        <Text className="text-muted-foreground">{emptyText}</Text>
      </View>
    );
  }

  const turns: RenderItem[][] = [];
  for (const item of items) {
    const current = turns[turns.length - 1];
    if (!current || item.kind === "user-message") {
      turns.push([item]);
      continue;
    }
    current.push(item);
  }

  return (
    <View className="flex-1 rounded-2xl border border-border/40 bg-muted/20">
      <ScrollView
        ref={scrollRef}
        className={compact ? "flex-1 px-3 py-3" : "flex-1 px-4 py-4"}
        contentContainerStyle={contentStyle}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        <View
          className={cn(
            mode === "timeline" ? "gap-2.5" : "gap-3",
            compact && "gap-2",
          )}
        >
          {mode === "timeline"
            ? turns.map((turn, turnIndex) => (
                <View
                  key={`turn-${turn[0]?.id ?? turnIndex}`}
                  className="flex-row gap-2.5"
                >
                  <View className="items-center">
                    <View className="mt-2 h-2 w-2 rounded-full bg-primary/50" />
                    {turnIndex < turns.length - 1 ? (
                      <View className="mt-1 w-px flex-1 bg-border/30" />
                    ) : null}
                  </View>
                  <View className="flex-1 gap-1.5 pb-1">
                    {turn.map((item) => (
                      <EventRenderer
                        key={`${item.kind}:${item.id}`}
                        item={item}
                        collapsedMetaByDefault={compact}
                      />
                    ))}
                  </View>
                </View>
              ))
            : items.map((item, index) => {
                const previous = items[index - 1];
                const showSeparator =
                  index > 0 &&
                  previous &&
                  toRole(previous.kind) !== toRole(item.kind);
                return (
                  <View key={`${item.kind}:${item.id}`} className="gap-3">
                    {showSeparator ? (
                      <Separator className="bg-border/30" />
                    ) : null}
                    <EventRenderer item={item} collapsedMetaByDefault={compact} />
                  </View>
                );
              })}
        </View>
      </ScrollView>
    </View>
  );
}
