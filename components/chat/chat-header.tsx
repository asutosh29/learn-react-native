import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { View } from "react-native";

type ChatHeaderProps = {
  title: string;
  statusLabel: string;
  statusVariant?: BadgeProps["variant"];
};

export function ChatHeader({
  title,
  statusLabel,
  statusVariant = "secondary",
}: ChatHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-2xl font-semibold">{title}</Text>
      <Badge variant={statusVariant}>
        <Text>{statusLabel}</Text>
      </Badge>
    </View>
  );
}
