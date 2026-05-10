import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react-native";
import { View } from "react-native";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  canSend?: boolean;
};

export function Composer({
  value,
  onChange,
  onSend,
  disabled = false,
  canSend = true,
}: ComposerProps) {
  return (
    <View className="rounded-2xl border border-border/100 bg-background/50 px-3 pb-3 pt-2">
      <Textarea
        value={value}
        onChangeText={onChange}
        placeholder="Type a message..."
        editable={!disabled}
        className="max-h-32 min-h-14 rounded-xl border-border/50 bg-muted text-base"
      />
      <View className="mt-2 flex-row items-center justify-end">
        <Button onPress={onSend} disabled={disabled || !canSend}>
          <Icon as={Send} size={16} />
          <Text>Send</Text>
        </Button>
      </View>
    </View>
  );
}
