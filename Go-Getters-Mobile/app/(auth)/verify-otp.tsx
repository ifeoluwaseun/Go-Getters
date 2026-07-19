import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  Platform, ScrollView, KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function VerifyOtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyAndCompleteRegister, resendOtp, currentUser } = useAuth();

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const email = currentUser?.email || "";

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  async function handleVerify() {
    if (!otpCode.trim() || otpCode.length < 6) {
      Alert.alert("Invalid Code", "Please enter a valid 6-digit confirmation code.");
      return;
    }

    setLoading(true);
    try {
      const user = await verifyAndCompleteRegister(email, otpCode.trim(), {
        name: currentUser?.name || "New User",
        role: currentUser?.role || "member",
        sponsorId: currentUser?.sponsorId,
        sponsorName: currentUser?.sponsorName,
      });

      if (user.status === 'approved') {
        router.replace("/(tabs)");
      } else {
        router.replace("/pending-approval");
      }
    } catch (err: any) {
      const errMsg = err?.message || "Verification failed. Please try again.";
      Alert.alert("Verification Error", errMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!email) return;
    setLoading(true);
    try {
      await resendOtp(email, 'signup');
      setResendCooldown(30);
      Alert.alert("Code Resent", "A new confirmation code has been sent to your email.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to resend confirmation code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.replace("/(auth)/register")} style={styles.back} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.foreground }]}>Confirm Your Email</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 32 }]}>
          Enter the 6-digit confirmation code we sent to{" "}
          <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.primary }}>{email || "your email"}</Text>
        </Text>

        <View style={{ marginBottom: 32 }}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Verification Code</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.primary }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <TextInput
              style={[styles.input, { color: colors.foreground, letterSpacing: 6, fontSize: 18, fontFamily: "Inter_700Bold" }]}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              value={otpCode}
              onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
              keyboardType="number-pad"
              autoFocus
              maxLength={6}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, opacity: loading || otpCode.length < 6 ? 0.7 : 1 }]}
          onPress={handleVerify}
          disabled={loading || otpCode.length < 6}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
            {loading ? "Verifying..." : "Verify & Complete Application"}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={loading || resendCooldown > 0}
            activeOpacity={0.7}
          >
            <Text style={{
              color: resendCooldown > 0 ? colors.mutedForeground : colors.primary,
              fontFamily: "Inter_600SemiBold",
              fontSize: 13
            }}>
              {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/(auth)/register")} activeOpacity={0.7}>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, textDecorationLine: "underline" }}>
              Edit Details
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, flexGrow: 1 },
  back: { marginBottom: 20 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 6 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 16 },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
