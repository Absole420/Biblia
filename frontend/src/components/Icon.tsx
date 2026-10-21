import Feather from "@react-native-vector-icons/feather";
import React from "react";

type Props = { name: string; size?: number; color: string; testID?: string };

export function Icon({ name, size = 20, color, testID }: Props) {
  return <Feather name={name as any} size={size} color={color} testID={testID} />;
}
