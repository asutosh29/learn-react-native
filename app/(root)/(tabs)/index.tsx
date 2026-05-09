import Button from "@/components/ui/button.bak";
import { Text } from "@/components/ui/text";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function Home() {
  const { signOut } = useAuth();
  const user = useUser();
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
      <Text className="text-2xl">Welcome, {user?.user?.firstName}!</Text>
      <Text className="text-5xl">Home</Text>
      <Button onPress={handleSignOut} variant="destructive">
        <Text className="text-white text-center">Sign Out</Text>
      </Button>
    </View>
  );
}
