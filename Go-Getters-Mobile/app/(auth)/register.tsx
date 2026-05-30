import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  Platform, ScrollView, KeyboardAvoidingView, Modal, FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserRole, LeaderOption } from "@/types";

const ROLES: { id: UserRole; label: string; desc: string; icon: string; color: string }[] = [
  { id: "member", label: "Member", desc: "I want to grow and execute daily", icon: "person", color: "#00e57d" },
  { id: "leader", label: "Team Leader", desc: "I lead and mentor a team of members", icon: "people", color: "#00d8fe" },
];

interface PickerProps {
  label: string;
  placeholder: string;
  value: string;
  options: LeaderOption[];
  onSelect: (opt: LeaderOption | null) => void;
  required?: boolean;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}

function DropdownPicker({ label, placeholder, value, options, onSelect, required, colors }: PickerProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <View>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          {label} {required && <Text style={{ color: colors.error }}>*</Text>}
        </Text>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
          style={[styles.pickerBtn, { backgroundColor: colors.muted, borderColor: value ? colors.primary : colors.border }]}
        >
          <Ionicons name="people-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.pickerText, { color: value ? colors.foreground : colors.mutedForeground, flex: 1 }]} numberOfLines={1}>
            {value || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            {!required && (
              <TouchableOpacity
                onPress={() => { onSelect(null); setOpen(false); }}
                activeOpacity={0.8}
                style={[styles.optionRow, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.optionText, { color: colors.mutedForeground, fontStyle: "italic" }]}>None / Skip</Text>
              </TouchableOpacity>
            )}
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onSelect(item); setOpen(false); }}
                  activeOpacity={0.8}
                  style={[styles.optionRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.optionAvatar, { backgroundColor: colors.primary + "22" }]}>
                    <Text style={[styles.optionInitials, { color: colors.primary }]}>{item.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.optionText, { color: colors.foreground }]}>{item.name}</Text>
                  {value === item.name && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyPicker, { color: colors.mutedForeground }]}>No options available</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorId, setSponsorId] = useState<string | undefined>(undefined);
  const [existingUsers, setExistingUsers] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await supabase.from('users').select('id, name').eq('status', 'approved');
        if (data) setExistingUsers(data);
      } catch (err) {
        console.error("Failed to load approved users:", err);
      }
    };
    fetchUsers();
  }, []);

  async function handleRegister() {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    if (!email.trim()) { Alert.alert("Email required"); return; }
    if (password.length < 6) { Alert.alert("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      let finalSponsorId = sponsorId;
      let finalSponsorName = sponsorName.trim() || undefined;

      if (finalSponsorName) {
        const exactMatch = existingUsers.find(
          u => u.name.trim().toLowerCase() === finalSponsorName!.toLowerCase()
        );
        if (exactMatch) {
          finalSponsorId = exactMatch.id;
          finalSponsorName = exactMatch.name;
        }
      } else {
        finalSponsorId = undefined;
      }

      const user = await register(
        name,
        email,
        password,
        role,
        undefined,
        undefined,
        finalSponsorId,
        finalSponsorName,
        adminCode || undefined,
      );

      if (user.status === 'approved') {
        router.replace("/(tabs)");
      } else {
        router.replace("/pending-approval");
      }
    } catch (err) {
      Alert.alert("Registration failed. Please try again.");
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
        <TouchableOpacity onPress={() => router.back()} style={styles.back} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.foreground }]}>Join Go-Getters</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Your application will be reviewed before access is granted</Text>

        {/* Basic Info */}
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
                  secureTextEntry={(field as any).secure}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Role */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>I am joining as a...</Text>
        <View style={styles.roles}>
          {ROLES.map((r) => {
            const selected = role === r.id;
            return (
              <TouchableOpacity key={r.id} onPress={() => setRole(r.id)} activeOpacity={0.8}
                style={[styles.roleCard, { backgroundColor: selected ? r.color + "14" : colors.card, borderColor: selected ? r.color : colors.border }]}>
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

        {/* Sponsor input with autocomplete */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Your Sponsor (Optional)</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="person-add-outline" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Type to search or enter manually..."
              placeholderTextColor={colors.mutedForeground}
              value={sponsorName}
              onChangeText={(text) => {
                setSponsorName(text);
                setSponsorId(undefined);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          </View>
          {showSuggestions && sponsorName.trim() !== "" && (
            <View style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              marginTop: 6,
              maxHeight: 180,
              overflow: "hidden",
              zIndex: 50,
            }}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 180 }}>
                {existingUsers.filter(u => u.name.toLowerCase().includes(sponsorName.toLowerCase())).length > 0 ? (
                  existingUsers
                    .filter(u => u.name.toLowerCase().includes(sponsorName.toLowerCase()))
                    .map(u => (
                      <TouchableOpacity
                        key={u.id}
                        onPress={() => {
                          setSponsorName(u.name);
                          setSponsorId(u.id);
                          setShowSuggestions(false);
                        }}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderBottomColor: colors.border,
                          borderBottomWidth: 1,
                        }}
                      >
                        <Ionicons name="person-outline" size={14} color={colors.primary} style={{ marginRight: 8 }} />
                        <Text style={{ color: colors.foreground, fontSize: 14 }}>{u.name}</Text>
                      </TouchableOpacity>
                    ))
                ) : (
                  <View style={{ padding: 12 }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, fontStyle: "italic" }}>
                      No matches found. Will use manual text.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Admin Code (collapsible) */}
        <TouchableOpacity onPress={() => setShowAdminCode(!showAdminCode)} activeOpacity={0.8} style={styles.adminToggle}>
          <Ionicons name={showAdminCode ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
          <Text style={[styles.adminToggleText, { color: colors.mutedForeground }]}>I am the organization owner</Text>
        </TouchableOpacity>

        {showAdminCode && (
          <View style={[styles.adminCodeBox, { backgroundColor: "#a855f712", borderColor: "#a855f733" }]}>
            <View style={styles.adminCodeHeader}>
              <Ionicons name="shield-checkmark" size={16} color="#a855f7" />
              <Text style={[styles.adminCodeTitle, { color: "#a855f7" }]}>Owner Access Code</Text>
            </View>
            <Text style={[styles.adminCodeSub, { color: colors.mutedForeground }]}>
              Enter your organization's admin code to register with full admin access and skip the approval queue.
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: showAdminCode ? "#a855f766" : colors.border }]}>
              <Ionicons name="key-outline" size={18} color="#a855f7" />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Enter admin code"
                placeholderTextColor={colors.mutedForeground}
                value={adminCode}
                onChangeText={setAdminCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        {/* Info: approval notice */}
        {!adminCode && (
          <View style={[styles.approvalNotice, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={[styles.approvalText, { color: colors.primary }]}>
              Your account will be reviewed by an admin before you get access. Your leader will be notified of your application.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
            {loading ? "Submitting..." : adminCode ? "Create Admin Account" : "Submit Application"}
          </Text>
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
  back: { marginBottom: 20 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 6 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 24 },
  fields: { gap: 14, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  roles: { gap: 10, marginBottom: 16 },
  roleCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 12 },
  roleIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  roleName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  roleDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  relationshipCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14, marginBottom: 16 },
  relationshipHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  relationshipTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  relationshipSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  pickerBtn: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  pickerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modalBackdrop: { flex: 1, backgroundColor: "#00000066", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  optionAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  optionInitials: { fontSize: 12, fontFamily: "Inter_700Bold" },
  optionText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyPicker: { textAlign: "center", padding: 32, fontSize: 14, fontFamily: "Inter_400Regular" },
  adminToggle: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center", marginBottom: 12 },
  adminToggleText: { fontSize: 13, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
  adminCodeBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, marginBottom: 14 },
  adminCodeHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  adminCodeTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  adminCodeSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  approvalNotice: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  approvalText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 16 },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  loginLink: { alignItems: "center" },
  loginText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
