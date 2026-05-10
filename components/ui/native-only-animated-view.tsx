import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { forwardRef } from "react";
import { Platform } from "react-native";
import Animated from "react-native-reanimated";

/**
 * This component is used to wrap animated views that should only be animated on native.
 * @param props - The props for the animated view.
 * @returns The animated view if the platform is native, otherwise the children.
 * @example
 * <NativeOnlyAnimatedView entering={FadeIn} exiting={FadeOut}>
 *   <Text>I am only animated on native</Text>
 * </NativeOnlyAnimatedView>
 */
type NativeOnlyAnimatedViewProps = ComponentPropsWithoutRef<
  typeof Animated.View
>;

const NativeOnlyAnimatedView = forwardRef<
  ElementRef<typeof Animated.View>,
  NativeOnlyAnimatedViewProps
>((props, ref) => {
  if (Platform.OS === "web") {
    return <>{props.children as ReactNode}</>;
  }

  return <Animated.View ref={ref} {...props} />;
});

NativeOnlyAnimatedView.displayName = "NativeOnlyAnimatedView";

export { NativeOnlyAnimatedView };
