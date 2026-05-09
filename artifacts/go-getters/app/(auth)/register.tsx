import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, ScrollView, KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

const ROLES: { id: UserRole; label: string; desc: string; icon: string; color: string }[] = [
  { id: "member", label: "Member", desc: "I want to grow and execute daily", icon: "person", color: "#00e57d" },
  { id: "sponsor", label: "Sponsor", desc: "I recruit and support my own team", icon: "person-add", color: "#ff6b35" },
  { id: "leader", label: "Team Leader", desc: "I lead and mentor a team of sponsors/members", icon: "people", color: "#00d8fe" },
  { id: "admin", label: "Admin", desc: "I manage the whole organization", icon: "shield", color: "#a855f7" },
];

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleRegister() {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    if (!email.trim()) { Alert.alert("Email required"); return; }
    if (password.length < 6) { Alert.alert("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, role);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.foreground }]}>Join Go-Getters</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Start your execution journey today</Text>

        <View style={styles.fields}>
          {[
            { label: "Full Name", icon: "person-outline", value: name, setter: setName, placeholder: "Your full name", keyboard: "default" as const },
            { label: "Email", icon: "mail-outline", value: email, setter: setEmail, placeholder: "your@email.com", keyboard: "email-address" as const },
            { label: "Password", icon: "lock-closed-outline", value: password, setter: setPassword, placeholder: "Min. 6 characters", keyboard: "default" as const, secure: true },
          ].map((field) => (
            <View key={field.label}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{field.label}</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name={field.icon as any} size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.keyboard}
                  autoCapitalize={field.keyboard === "email-address" ? "none" : "words"}
                  secureTextEntry={field.secure}
                />
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.roleLabel, { color: colors.foreground }]}>I am a...</Text>
        <View style={styles.roles}>
          {ROLES.map((r) => {
            const selected = role === r.id;
            return (
              <TouchableOpacity key={r.id} onPress={() => setRole(r.id)} activeOpacity={0.8} style={[styles.roleCard, { backgroundColor: selected ? r.color + "14" : colors.card, borderColor: selected ? r.color : colors.border }]}>
                <View style={[styles.roleIcon, { backgroundColor: selected ? r.color + "22" : colors.muted }]}>
                  <Ionicons name={r.icon as any} size={20} color={selected ? r.color : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleName, { color: colors.foreground }]}>{r.label}</Text>
                  <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={20} color={r.color} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Role context hint */}
        {(role === "leader" || role === "sponsor") && (
          <View style={[styles.hintBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={[styles.hintText, { color: colors.primary }]}>
              {role === "leader"
                ? "As a Team Leader, you'll have access to the Team Review screen to monitor all members' tasks, goals, and evidence."
                : "As a Sponsor, you'll be able to see and review the progress of team members you personally recruit."}
            </Text>
          </View>
        )}

        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>{loading ? "Creating account..." : "Create Account"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.loginLink} activeOpacity={0.7}>
          <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, flexGrow: 1 },
  back: { marginBottom: 24 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
  fields: { gap: 14, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  roleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  roles: { gap: 10, marginBottom: 16 },
  roleCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 12 },
  roleIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  roleName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  roleDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  hintBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 16 },
  hintText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 16 },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  loginLink: { alignItems: "center" },
  loginText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
