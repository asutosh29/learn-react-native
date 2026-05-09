import Button from "@/components/ui/button.bak";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useSignIn } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");

  const handleSubmit = async () => {
    const { error } = await signIn.password({
      emailAddress,
      password,
    });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          // Handle session tasks
          // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }

          // If no session tasks, navigate the signed-in user to the home page
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url as Href);
          }
        },
      });
    } else if (signIn.status === "needs_second_factor") {
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
    } else if (signIn.status === "needs_client_trust") {
      // For other second factor strategies,
      // see https://clerk.com/docs/guides/development/custom-flows/authentication/client-trust
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code",
      );

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    } else {
      // Check why the sign-in is not complete
      console.error("Sign-in attempt not complete:", signIn);
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          // Handle session tasks
          // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }

          // If no session tasks, navigate the signed-in user to the home page
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url as Href);
          }
        },
      });
    } else {
      // Check why the sign-in is not complete
      console.error("Sign-in attempt not complete:", signIn);
    }
  };

  if (signIn.status === "needs_client_trust") {
    return (
      <View>
        <Text className="text-2xl font-bold">Verify your account</Text>
        <Input
          className="border border-gray-300 rounded p-2 mt-2"
          value={code}
          placeholder="Code"
          onChangeText={(code) => setCode(code)}
          keyboardType="numeric"
        />
        {errors.fields.code && (
          <Text className="text-red-500 text-sm">
            {errors.fields.code.message}
          </Text>
        )}
        <Button
          className="mt-4"
          onPress={handleVerify}
          disabled={fetchStatus === "fetching"}
        >
          <Text className="text-white text-center font-semibold">Verify</Text>
        </Button>
        <Pressable className="mt-4" onPress={() => signIn.mfa.sendEmailCode()}>
          <Text className="text-blue-500 text-center">Resend code</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-3xl font-extrabold tracking-tight">Sign in</Text>

      <Input
        className="border border-gray-300 rounded p-2 mt-4"
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Email"
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        keyboardType="email-address"
      />
      <Input
        className="border border-gray-300 rounded p-2 mt-2"
        value={password}
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />

      <Button
        className="mt-4"
        onPress={handleSubmit}
        disabled={!emailAddress || !password || fetchStatus === "fetching"}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Continue
        </Text>
      </Button>

      <View className="flex-row justify-center mt-6">
        <Text className="text-gray-600">No account? </Text>
        <Link href="/(auth)/sign-up.bak">
          <Text className="text-blue-600 font-bold">Sign up</Text>
        </Link>
      </View>
    </View>
  );
}
