import Button from "@/components/ui/button";
import { Link, Slot } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function AuthLayout() {
  return (
    <View className="p-8">
      <Button variant="ghost" className="mb-4">
        <Link href={"/"} className="text-white">
          Back to Home
        </Link>
      </Button>
      <Slot />
    </View>
  );
}
