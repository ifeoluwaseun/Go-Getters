import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, ScrollView, KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleLogin() {
    if (!email.trim()) { Alert.alert("Email required"); return; }
    if (!password.trim()) { Alert.alert("Password required"); return; }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user && (user.status === 'pending' || user.status === 'rejected')) {
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
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Password</Text>
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

          <View style={[styles.hintBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={[styles.hintText, { color: colors.primary }]}>Try: admin@gogetters.app or leader@gogetters.app</Text>
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
