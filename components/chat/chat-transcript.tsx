import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import React, { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { MessageBubble } from "./message-bubble";

type MessageRole = "user" | "assistant" | "system";

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: "streaming" | "done" | "error";
  title?: string;
  meta?: string;
};

type ChatTranscriptProps = {
  messages: ChatMessage[];
  emptyText?: string;
};

export function ChatTranscript({
  messages,
  emptyText = "No messages yet.",
}: ChatTranscriptProps) {
  const scrollRef = useRef<ScrollView>(null);
  const contentStyle = { flexGrow: 1, justifyContent: "flex-end" as const };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center rounded-3xl bg-muted/30 p-6">
        <Text className="text-muted-foreground">{emptyText}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 rounded-3xl bg-muted/30">
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 py-5"
        contentContainerStyle={contentStyle}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        <View className="gap-4">
          {messages.map((message, index) => {
            const showSeparator =
              index > 0 && messages[index - 1]?.role !== message.role;
            return (
              <View key={message.id} className="gap-4">
                {showSeparator && <Separator />}
                <MessageBubble
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  status={message.status}
                  title={message.title}
                  meta={message.meta}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
