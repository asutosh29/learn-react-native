import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { PortalHost } from "@rn-primitives/portal";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default function RootLayout() {
  let colorScheme = useColorScheme();
  console.log(colorScheme);
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <StatusBar style="light" />
      <SafeAreaView>
        <View className="min-h-screen bg-white dark:bg-background">
          <Slot />
        </View>
      </SafeAreaView>
      <PortalHost />
    </ClerkProvider>
  );
}
