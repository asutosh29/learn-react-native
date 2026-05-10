import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { View } from "react-native";

type MessageRole = "user" | "assistant" | "system";
type MessageBubbleProps = {
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: "streaming" | "done" | "error";
  title?: string;
  meta?: string;
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  role,
  content,
  timestamp,
  status,
  title,
  meta,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const bubbleClasses = cn(
    "max-w-[78%] gap-2 rounded-2xl px-4 py-3",
    isUser && "bg-primary border-primary/20",
    isSystem && "bg-secondary border-secondary/40",
    !isUser && !isSystem && "bg-muted/60",
  );
  const textClasses = cn(isUser && "text-primary-foreground");
  const fallbackText = isUser ? "U" : isSystem ? "S" : "A";
  const bodyText = content
    ? content
    : status === "streaming"
      ? "Typing..."
      : status === "error"
        ? "Something went wrong."
        : "";
  const footerText = meta
    ? `${formatTime(timestamp)} - ${meta}`
    : formatTime(timestamp);

  return (
    <View
      className={cn(
        "flex-row items-end gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <Avatar alt={`${role} avatar`} className="size-8">
          <AvatarFallback>
            <Text className="text-xs font-semibold">{fallbackText}</Text>
          </AvatarFallback>
        </Avatar>
      )}
      <View className={cn("gap-1", isUser && "items-end")}>
        {title ? (
          <Text className="text-xs text-muted-foreground">{title}</Text>
        ) : null}
        <View className={bubbleClasses}>
          <Text className={cn("text-base leading-6", textClasses)}>
            {bodyText}
          </Text>
        </View>
        <Text className="text-muted-foreground text-xs">{footerText}</Text>
      </View>
      {isUser && (
        <Avatar alt="User avatar" className="size-8">
          <AvatarFallback>
            <Text className="text-xs font-semibold">{fallbackText}</Text>
          </AvatarFallback>
        </Avatar>
      )}
    </View>
  );
}
