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
    <View className="gap-3">
      <Textarea
        value={value}
        onChangeText={onChange}
        placeholder="Type a message..."
        editable={!disabled}
        className="min-h-20"
      />
      <View className="flex-row items-center justify-end">
        <Button onPress={onSend} disabled={disabled || !canSend}>
          <Icon as={Send} size={16} />
          <Text>Send</Text>
        </Button>
      </View>
    </View>
  );
}
