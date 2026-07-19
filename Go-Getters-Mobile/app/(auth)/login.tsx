import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, ScrollView, KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleLogin() {
    if (!email.trim()) { Alert.alert("Email required"); return; }
    if (!password.trim()) { Alert.alert("Password required"); return; }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user && user.status === 'unconfirmed') {
        router.replace("/(auth)/otp");
      } else if (user && (user.status === 'pending' || user.status === 'rejected')) {
        router.replace("/pending-approval");
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      Alert.alert("Login failed", "Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestReset() {
    if (!forgotEmail.trim()) { Alert.alert("Email required"); return; }
    setForgotError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase());
      if (error) throw error;
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err?.message || "Failed to send recovery email");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyRecovery() {
    if (!recoveryCode.trim() || recoveryCode.length < 6) { Alert.alert("Invalid code"); return; }
    setForgotError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: forgotEmail.trim().toLowerCase(),
        token: recoveryCode.trim(),
        type: 'recovery',
      });
      if (error) throw error;
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err?.message || "Invalid or expired recovery code");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 6) { Alert.alert("Password must be at least 6 characters"); return; }
    setForgotError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      await supabase.auth.signOut();
      
      Alert.alert("Success", "Password updated successfully! Please sign in with your new password.");
      setShowForgot(false);
      setForgotStep(1);
      setForgotEmail("");
      setRecoveryCode("");
      setNewPassword("");
    } catch (err: any) {
      setForgotError(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  if (showForgot) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => { setShowForgot(false); setForgotStep(1); setForgotError(""); }} style={styles.back} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <Text style={[styles.formTitle, { color: colors.foreground, marginTop: 10 }]}>
            {forgotStep === 1 && "Reset Password"}
            {forgotStep === 2 && "Enter Recovery Code"}
            {forgotStep === 3 && "Choose New Password"}
          </Text>
          <Text style={[styles.formSub, { color: colors.mutedForeground, marginBottom: 24 }]}>
            {forgotStep === 1 && "Enter your email address to receive a recovery code."}
            {forgotStep === 2 && `Enter the 6-digit recovery code we sent to ${forgotEmail}`}
            {forgotStep === 3 && "Ensure your password is at least 6 characters long."}
          </Text>

          <View style={styles.fields}>
            {forgotStep === 1 && (
              <View>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Email Address</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.mutedForeground}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {forgotStep === 2 && (
              <View>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Recovery Code</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.primary }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground, letterSpacing: 6, fontSize: 18, fontFamily: "Inter_700Bold" }]}
                    placeholder="000000"
                    placeholderTextColor={colors.mutedForeground}
                    value={recoveryCode}
                    onChangeText={(text) => setRecoveryCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
              </View>
            )}

            {forgotStep === 3 && (
              <View>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>New Password</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={colors.mutedForeground}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoFocus
                  />
                </View>
              </View>
            )}
          </View>

          {forgotError ? (
            <Text style={{ color: colors.error, fontSize: 13, textAlign: "center", marginTop: 12 }}>{forgotError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary, marginTop: 24, opacity: loading ? 0.7 : 1 }]}
            onPress={
              forgotStep === 1 ? handleRequestReset :
              forgotStep === 2 ? handleVerifyRecovery :
              handleUpdatePassword
            }
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.loginText, { color: colors.primaryForeground }]}>
              {loading ? "Processing..." :
               forgotStep === 1 ? "Send Recovery Code" :
               forgotStep === 2 ? "Verify Recovery Code" :
               "Update Password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setShowForgot(false); setForgotStep(1); setForgotError(""); }}
            style={{ alignItems: "center", marginTop: 20 }}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.mutedForeground, textDecorationLine: "underline", fontSize: 13 }}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
            <Text style={[styles.logoText, { color: colors.primary }]}>GG</Text>
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>Go-Getters</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>A high-performance execution system</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[styles.formSub, { color: colors.mutedForeground }]}>Sign in to continue building momentum</Text>

          <View style={styles.fields}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Email</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Password</Text>
                <TouchableOpacity onPress={() => { setShowForgot(true); setForgotEmail(email); }} activeOpacity={0.7} style={{ paddingVertical: 2 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass((p) => !p)} activeOpacity={0.7}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            <Text style={[styles.loginText, { color: colors.primaryForeground }]}>{loading ? "Signing in..." : "Sign In"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/(auth)/register")} style={styles.registerLink} activeOpacity={0.7}>
            <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
              New to Go-Getters?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, flexGrow: 1 },
  back: { marginBottom: 12 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 12 },
  logoText: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  appName: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular" },
  form: { gap: 16 },
  formTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  formSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -8 },
  fields: { gap: 14 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  hintBox: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, padding: 10, borderWidth: 1 },
  hintText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  loginBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  loginText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  registerLink: { alignItems: "center", paddingVertical: 4 },
  registerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

