import React from "react";
import { View } from "react-native";
import DrugScreen from "../features/drugRecommendation/DrugScreen";

export default function DrugRecommendationPage() {
  return (
    <View style={{ flex: 1 }}>
      <DrugScreen />
    </View>
  );
}