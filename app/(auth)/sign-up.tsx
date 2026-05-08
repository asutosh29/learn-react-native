import { useAuth, useSignUp } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");

  const handleSubmit = async () => {
    const { error } = await signUp.password({
      emailAddress,
      password,
    });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({
      code,
    });
    if (signUp.status === "complete") {
      await signUp.finalize({
        // Redirect the user to the home page after signing up
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
      // Check why the sign-up is not complete
      console.error("Sign-up attempt not complete:", signUp);
    }
  };

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <View>
        <Text className="text-2xl font-bold">Verify account</Text>
        <TextInput
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
        <Pressable
          className={`p-3 rounded mt-4 ${fetchStatus === "fetching" ? "bg-blue-300" : "bg-blue-500"}`}
          onPress={handleVerify}
          disabled={fetchStatus === "fetching"}
        >
          <Text className="text-white text-center font-semibold">Verify</Text>
        </Pressable>
        <Pressable
          className="mt-4"
          onPress={() => signUp.verifications.sendEmailCode()}
        >
          <Text className="text-blue-500 text-center">Resend code</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-3xl font-extrabold tracking-tight">Sign up</Text>

      <TextInput
        className="border border-gray-300 rounded p-2 mt-4"
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Email"
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        keyboardType="email-address"
      />
      <TextInput
        className="border border-gray-300 rounded p-2 mt-2"
        value={password}
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />

      <Pressable
        className={`p-3 rounded mt-4 ${!emailAddress || !password || fetchStatus === "fetching" ? "bg-blue-300" : "bg-blue-500"}`}
        onPress={handleSubmit}
        disabled={!emailAddress || !password || fetchStatus === "fetching"}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Sign up
        </Text>
      </Pressable>

      <View className="flex-row justify-center mt-6">
        <Text className="text-gray-600">Already have an account? </Text>
        <Link href="/sign-in">
          <Text className="text-blue-600 font-bold">Sign in</Text>
        </Link>
      </View>

      <View nativeID="clerk-captcha" />
    </View>
  );
}
