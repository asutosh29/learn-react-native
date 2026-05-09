import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button.bak";
import { Text } from "@/components/ui/text";
import { useAuth } from "@clerk/expo";
import { Link, Redirect } from "expo-router";
import { View } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return null;
  }
  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)" />;
  }
  return (
    <View className="flex py-16 px-6 gap-2 h-screen justify-between">
      <View className="flex-1">
        <Text className="text-7xl/none font-bold">Welcome!</Text>
        <Text className="text-4xl font-bold">Your own AI Agent!</Text>
      </View>
      <View className="flex gap-2 items-end">
        <Badge variant="outline" className="mt-4">
          <Text className="text-xl">🔥</Text>
        </Badge>
        <Button variant="primary">
          <Link className="text-white font-bold" href={"/(auth)/sign-in"}>
            Get Started!
          </Link>
        </Button>
      </View>
    </View>
  );
}
