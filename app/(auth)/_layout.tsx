import { Slot } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function AuthLayout() {
  return (
    <View className="p-8">
      <Slot />
    </View>
  );
}
