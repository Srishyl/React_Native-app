import React, { useState } from "react";
import { Text, TextInput } from '@/components/AppText';

import { View, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { getDrugRecommendation } from "./drugService";

// ─── Dropdown Component ──────────────────────────────────────────────────────
function OptionSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionChip, value === opt && styles.optionChipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Radio Row Component ─────────────────────────────────────────────────────
function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.radioRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={styles.radioItem}
            onPress={() => onChange(opt)}
          >
            <View style={styles.radioOuter}>
              {value === opt && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function DrugScreen() {
  const [disease, setDisease] = useState("");
  const [isAdult, setIsAdult] = useState(true);
  const [temp, setTemp] = useState("Moderate");
  const [weakness, setWeakness] = useState("Mild");
  const [vomiting, setVomiting] = useState("No");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!disease.trim()) {
      Alert.alert("Missing Input", "Please enter a disease name.");
      return;
    }

    setLoading(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const ageGroup = isAdult ? "Adult" : "Child";
      const response = await getDrugRecommendation(
        disease,
        ageGroup,
        false,        // allergy removed from UI — passed as false
        temp,
        weakness,
        vomiting
      );

      if (response.error) {
        setErrorMsg(response.error);
      } else {
        setResult(response);
      }
    } catch (err: any) {
      console.error("handleSubmit error:", err);
      setErrorMsg(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskConfig = (risk: string) => {
    if (risk === "Emergency") return { color: "#FF3B30", bg: "#FFF0EF", icon: "🚨", label: "Emergency" };
    if (risk === "Moderate") return { color: "#FF9500", bg: "#FFF8EF", icon: "⚠️", label: "Moderate" };
    return { color: "#34C759", bg: "#F0FFF4", icon: "✅", label: "Mild" };
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerIcon}>💊</Text>
        <Text style={styles.headerTitle}>Drug Advisory</Text>
        <Text style={styles.headerSubtitle}>Get instant treatment guidance for common diseases</Text>
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>

        {/* Disease Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Disease / Condition</Text>
          <TextInput
            value={disease}
            onChangeText={setDisease}
            placeholder="e.g., Dengue, Malaria, Typhoid..."
            placeholderTextColor="#aaa"
            style={styles.input}
            autoCapitalize="words"
          />
        </View>

        {/* Age Group */}
        <RadioGroup
          label="Age Group"
          options={["Adult", "Child"]}
          value={isAdult ? "Adult" : "Child"}
          onChange={(v) => setIsAdult(v === "Adult")}
        />

        {/* Temperature */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>🌡️ Temperature Level</Text>
          <View style={styles.optionRow}>
            {(["Low", "Moderate", "High", "VeryHigh"] as const).map((opt) => {
              const displayLabel = opt === "VeryHigh" ? "Very High" : opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionChip, temp === opt && styles.optionChipActive]}
                  onPress={() => setTemp(opt)}
                >
                  <Text style={[styles.optionText, temp === opt && styles.optionTextActive]}>
                    {displayLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Weakness */}
        <OptionSelector
          label="💪 Weakness Level"
          options={["None", "Mild", "Moderate", "Severe"]}
          value={weakness}
          onChange={setWeakness}
        />

        {/* Vomiting */}
        <RadioGroup
          label="🤢 Vomiting"
          options={["Yes", "No"]}
          value={vomiting}
          onChange={setVomiting}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🔍  GET ADVISORY</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Card */}
      {errorMsg && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>⚠️  Advisory Not Available</Text>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Text style={styles.errorHint}>Try: Dengue, Malaria, Typhoid, Cold, Fever, Diarrhea, Asthma, TB, Diabetes...</Text>
        </View>
      )}

      {/* Result Cards */}
      {result && !result.error && (() => {
        const risk = getRiskConfig(result.risk_level);
        return (
          <View style={styles.resultWrapper}>

            {/* Risk Banner */}
            <View style={[styles.riskBanner, { backgroundColor: risk.bg, borderColor: risk.color }]}>
              <View style={[styles.riskBadge, { backgroundColor: risk.color }]}>
                <Text style={styles.riskBadgeText}>{risk.icon} {risk.label} Risk</Text>
              </View>
              <Text style={[styles.riskMessage, { color: risk.color }]}>{result.urgencyMessage}</Text>
              {result.confidence && (
                <Text style={styles.confidenceText}>ML Confidence: {result.confidence}%</Text>
              )}
            </View>

            {/* Medicine Card */}
            <View style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <Text style={styles.resultCardIcon}>💊</Text>
                <Text style={styles.resultCardTitle}>Recommended Medicine</Text>
              </View>
              <InfoRow icon="🏷️" label="Medicine" value={result.medicine} />
              <InfoRow icon="📏" label="Dosage" value={result.dosage} />
            </View>

            {/* Avoid Card */}
            {result.avoid && result.avoid.length > 0 && (
              <View style={[styles.resultCard, styles.avoidCard]}>
                <View style={styles.resultCardHeader}>
                  <Text style={styles.resultCardIcon}>🚫</Text>
                  <Text style={styles.resultCardTitle}>Do NOT Take</Text>
                </View>
                {result.avoid.map((item: string, i: number) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Red Flags */}
            <View style={[styles.resultCard, styles.redFlagCard]}>
              <View style={styles.resultCardHeader}>
                <Text style={styles.resultCardIcon}>🚨</Text>
                <Text style={styles.resultCardTitle}>Go to PHC Immediately if:</Text>
              </View>
              {result.red_flags.map((item: string, i: number) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: "#d00000" }]}>›</Text>
                  <Text style={[styles.bulletText, { color: "#5a0000" }]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Self Care */}
            <View style={[styles.resultCard, styles.selfCareCard]}>
              <View style={styles.resultCardHeader}>
                <Text style={styles.resultCardIcon}>🏠</Text>
                <Text style={styles.resultCardTitle}>Home Self-Care</Text>
              </View>
              {result.self_care.map((item: string, i: number) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: "#1a7340" }]}>✓</Text>
                  <Text style={[styles.bulletText, { color: "#1a4a2e" }]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Follow Up */}
            <View style={styles.followUpBanner}>
              <Text style={styles.followUpText}>📅 {result.followUpMessage}</Text>
            </View>

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              ⚕️ This advisory is for initial guidance only. Always consult a certified doctor for diagnosis and treatment.
            </Text>
          </View>
        );
      })()}

    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f6fb",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  // Header
  headerCard: {
    backgroundColor: "#1a73e8",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  headerIcon: { fontSize: 36, marginBottom: 6 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textAlign: "center",
  },

  // Form
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 14,
  },
  fieldGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    color: "#222",
  },

  // Option Chips (Dropdown replacement)
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#d0d5e8",
    backgroundColor: "#f0f2fa",
  },
  optionChipActive: {
    backgroundColor: "#1a73e8",
    borderColor: "#1a73e8",
  },
  optionText: { fontSize: 13, color: "#555", fontWeight: "600" },
  optionTextActive: { color: "#fff" },

  // Radio
  radioRow: { flexDirection: "row", gap: 24 },
  radioItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1a73e8",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1a73e8",
  },
  radioLabel: { fontSize: 14, color: "#333", fontWeight: "600" },

  // Button
  button: {
    backgroundColor: "#1a73e8",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: { backgroundColor: "#90bef5" },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 1 },

  // Error
  errorCard: {
    backgroundColor: "#fff0f0",
    borderLeftWidth: 4,
    borderLeftColor: "#d00000",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  errorTitle: { fontWeight: "800", color: "#d00000", fontSize: 15, marginBottom: 6 },
  errorText: { color: "#5a0000", fontSize: 14, marginBottom: 8 },
  errorHint: { color: "#888", fontSize: 12, fontStyle: "italic" },

  // Result Wrapper
  resultWrapper: { gap: 12 },

  // Risk Banner
  riskBanner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
  },
  riskBadge: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 10,
  },
  riskBadgeText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
  riskMessage: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  confidenceText: { fontSize: 12, color: "#888", marginTop: 6 },

  // Result Cards
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avoidCard: { backgroundColor: "#fff8f0" },
  redFlagCard: { backgroundColor: "#fff0f0" },
  selfCareCard: { backgroundColor: "#f0fff4" },

  resultCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  resultCardIcon: { fontSize: 20, marginRight: 8 },
  resultCardTitle: { fontSize: 15, fontWeight: "800", color: "#222" },

  // Info Row
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  infoIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#999", fontWeight: "700", textTransform: "uppercase" },
  infoValue: { fontSize: 14, color: "#222", fontWeight: "600", marginTop: 2 },

  // Bullet
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  bulletDot: { fontSize: 16, fontWeight: "800", marginRight: 8, color: "#555", lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 14, color: "#444", lineHeight: 20 },

  // Follow Up
  followUpBanner: {
    backgroundColor: "#e8f0fe",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  followUpText: { color: "#1a73e8", fontWeight: "700", fontSize: 14 },

  // Disclaimer
  disclaimer: {
    textAlign: "center",
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    lineHeight: 16,
  },
});