import Button from "@/components/ui/button";
import { useAuth } from "@clerk/expo";
import { Link, Redirect } from "expo-router";
import { Text, View } from "react-native";

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
      <Text className="text-4xl font-bold">Welcome to the app!</Text>
      <Button variant="primary">
        <Link className="text-white" href={"/(auth)/sign-in"}>
          Sign In
        </Link>
      </Button>
      <Button variant="secondary">
        <Link className="text-white" href={"/(auth)/sign-up"}>
          Sign Up
        </Link>
      </Button>
    </View>
  );
}
