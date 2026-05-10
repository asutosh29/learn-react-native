import Button from "@/components/ui/button.bak";
import { useAuth } from "@clerk/expo";
import { Link, Redirect, Slot } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return null;
  }
  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)" />;
  }
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
