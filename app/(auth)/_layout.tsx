import Button from "@/components/ui/button.bak";
import { Link, Slot } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function AuthLayout() {
  return (
    <View className="flex justify-between p-8 h-screen">
      <Slot />
      <View className="flex">
        <Button variant="primary" className="mb-4 inline-block">
          <Link href={"/"} className="text-white">
            Home!
          </Link>
        </Button>
      </View>
    </View>
  );
}
