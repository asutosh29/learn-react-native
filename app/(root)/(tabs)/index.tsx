import Button from "@/components/ui/button";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function Home() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  return (
    <View>
      <Text className="text-5xl">Home</Text>
      <Button onPress={handleSignOut} variant="destructive">
        <Text className="text-white text-center">Sign Out</Text>
      </Button>
    </View>
  );
}
