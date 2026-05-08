import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-red-700 rounded px-4 py-2 mt-4"
      >
        <Text className="text-white text-center">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
