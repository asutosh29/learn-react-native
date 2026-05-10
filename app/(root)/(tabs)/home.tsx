import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Link } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 bg-background px-6 pt-12">
      <View className="gap-4">
        <Text className="text-2xl font-semibold">Home</Text>
        <Link href="/(chat)" asChild>
          <Button className="self-start">
            <Text>Open Chat</Text>
          </Button>
        </Link>
      </View>
    </View>
  );
}
