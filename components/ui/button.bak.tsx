import { cn } from "@/lib/utils";
import React from "react";
import { TouchableOpacity } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonProps = {
  variant?: ButtonVariant;
} & React.ComponentProps<typeof TouchableOpacity>;

export default function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      {...props}
      className={cn(getButtonStyle(variant), className)}
    >
      {children}
    </TouchableOpacity>
  );
}

const getButtonStyle = (variant: ButtonVariant) => {
  switch (variant) {
    case "primary":
      return "p-3 rounded bg-blue-500";
    case "secondary":
      return "p-3 rounded bg-green-500";
    case "ghost":
      return "p-3 rounded bg-gray-500";
    case "destructive":
      return "p-3 rounded bg-red-500";
    default:
      return "p-3 rounded bg-blue-500";
  }
};
