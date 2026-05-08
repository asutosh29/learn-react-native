import { useAuth } from "@clerk/expo";
import { Link, Redirect } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return null;
  }
  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)" />;
  }
  return (
    <View className="flex p-8 gap-2">
      <Text className="text-lg">Welcome to the app!</Text>
      <TouchableOpacity className="rounded bg-blue-500 px-4 py-2">
        <Link className="text-white" href={"/(auth)/sign-in"}>
          Sign In
        </Link>
      </TouchableOpacity>
      <TouchableOpacity className="rounded bg-green-500 px-4 py-2">
        <Link className="text-white" href={"/(auth)/sign-up"}>
          Sign Up
        </Link>
      </TouchableOpacity>
    </View>
  );
}
