import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { ProgressBar } from "@/components/ProgressBar";
import { Evidence } from "@/types";

const INACTIVE_USERS = [
  { id: "u10", name: "Jake M.", lastSeen: "3 days ago", missedTasks: 8, consistency: 32 },
  { id: "u11", name: "Olivia R.", lastSeen: "2 days ago", missedTasks: 5, consistency: 45 },
  { id: "u12", name: "Tyler B.", lastSeen: "5 days ago", missedTasks: 12, consistency: 18 },
];

const ROLE_LABELS = { admin: "Admin", leader: "Team Leader", member: "Member" };
const ROLE_COLORS = { admin: "#a855f7", leader: "#00d8fe", member: "#6b7280" };

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, evidence, leaderboard, approveEvidence, rejectEvidence } = useApp();
  const { pendingUsers, approveUser, rejectUser, allUsers, adminUpdateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "approvals" | "evidence" | "compliance">("overview");

  // Connection management states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [assignedLeaderId, setAssignedLeaderId] = useState("none");
  const [assignedSponsorName, setAssignedSponsorName] = useState("");
  const [assignedSponsorId, setAssignedSponsorId] = useState<string | null>(null);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false);

  const approvedUsers = allUsers.filter(u => u.status === 'approved');

  const handleSaveConnection = async () => {
    if (!selectedUser) return;
    try {
      const selectedLeader = approvedUsers.find(u => u.id === assignedLeaderId);
      const leaderId = selectedLeader ? selectedLeader.id : null;
      const leaderName = selectedLeader ? selectedLeader.name : null;

      // Handle Sponsor Matching
      let sponsorId = assignedSponsorId;
      let sponsorName = assignedSponsorName.trim() || null;
      if (sponsorName) {
        const exactMatch = approvedUsers.find(
          u => u.name.trim().toLowerCase() === sponsorName!.toLowerCase()
        );
        if (exactMatch) {
          sponsorId = exactMatch.id;
          sponsorName = exactMatch.name;
        } else {
          sponsorId = null;
        }
      } else {
        sponsorId = null;
        sponsorName = null;
      }

      await approveUser(selectedUser.id);

      await adminUpdateUser(selectedUser.id, {
        leaderId: leaderId || undefined,
        leaderName: leaderName || undefined,
        sponsorId: sponsorId || undefined,
        sponsorName: sponsorName || undefined
      });

      setManageModalVisible(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Failed to approve and save connections on mobile:", err);
      Alert.alert("Error", "Failed to complete approval and save connections.");
    }
  };

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const totalUsers = leaderboard.length + INACTIVE_USERS.length;
  const activeUsers = leaderboard.length;
  const avgCompletion = Math.round(leaderboard.reduce((a, u) => a + u.completionRate, 0) / leaderboard.length);
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingEvidence = evidence.filter((e) => e.status === "pending");

  function handleApproveEvidence(id: string) {
    Alert.alert("Approve Evidence", "Approve this submission?", [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => approveEvidence(id) },
    ]);
  }

  function handleRejectEvidence(id: string) {
    Alert.alert("Reject Evidence", "Reject with feedback: 'Please provide clearer proof of completion.'", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => rejectEvidence(id, "Please provide clearer proof of completion.") },
    ]);
  }

  function handleApproveUser(userId: string, userName: string) {
    Alert.alert("Approve Application", `Grant ${userName} access to Go-Getters?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => approveUser(userId) },
    ]);
  }

  function handleRejectUser(userId: string, userName: string) {
    Alert.alert(
      "Reject Application",
      `Reject ${userName}'s application?\n\nThey will be notified and their access will be denied.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            Alert.alert("Select Reason", "Choose a rejection reason:", [
              {
                text: "Incomplete information",
                onPress: () => rejectUser(userId, "Your application had incomplete information. Please re-apply with accurate details."),
              },
              {
                text: "Does not meet criteria",
                onPress: () => rejectUser(userId, "Your application does not meet our current membership criteria. Contact your sponsor for guidance."),
              },
              {
                text: "Duplicate account",
                onPress: () => rejectUser(userId, "An account with this information already exists. Please log in to your existing account."),
              },
              { text: "Cancel", style: "cancel" },
            ]);
          },
        },
      ]
    );
  }

  const TABS = [
    { id: "overview" as const, label: "Overview" },
    { id: "approvals" as const, label: "Approvals", badge: pendingUsers.length },
    { id: "evidence" as const, label: "Evidence", badge: pendingEvidence.length },
    { id: "compliance" as const, label: "Compliance" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.adminBanner, { backgroundColor: colors.secondary }]}>
        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        <Text style={styles.adminText}>Admin Dashboard — Full Access</Text>
      </View>

      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} activeOpacity={0.8}
            style={[styles.tab, { borderBottomColor: activeTab === tab.id ? colors.primary : "transparent", borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
            {(tab.badge ?? 0) > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: tab.id === "approvals" ? "#fbbf24" : colors.error }]}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <>
            <View style={styles.statsGrid}>
              {[
                { label: "Total Users", value: totalUsers, icon: "people", color: colors.primary },
                { label: "Active Today", value: activeUsers, icon: "pulse", color: colors.success },
                { label: "Avg Completion", value: `${avgCompletion}%`, icon: "trending-up", color: "#fbbf24" },
                { label: "Tasks Done", value: completedTasks, icon: "checkmark-circle", color: "#a855f7" },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.color + "22" }]}>
                    <Ionicons name={s.icon as any} size={18} color={s.color} />
                  </View>
                  <Text style={[styles.statVal, { color: colors.foreground }]}>{s.value}</Text>
                  <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {pendingUsers.length > 0 && (
              <TouchableOpacity onPress={() => setActiveTab("approvals")} activeOpacity={0.8}
                style={[styles.pendingAlert, { backgroundColor: "#fbbf2412", borderColor: "#fbbf2440" }]}>
                <Ionicons name="hourglass-outline" size={18} color="#fbbf24" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pendingAlertTitle, { color: "#fbbf24" }]}>{pendingUsers.length} Application{pendingUsers.length > 1 ? "s" : ""} Awaiting Review</Text>
                  <Text style={[styles.pendingAlertSub, { color: "#fbbf2499" }]}>Tap to review and approve</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#fbbf24" />
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Team Performance</Text>
            {leaderboard.slice(0, 5).map((user) => (
              <View key={user.id} style={[styles.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.userAvatar, { backgroundColor: colors.primary + "33" }]}>
                  <Text style={[styles.userInitials, { color: colors.primary }]}>{user.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
                  <ProgressBar progress={user.completionRate} height={5} color={user.completionRate >= 80 ? colors.success : user.completionRate >= 50 ? colors.warning : colors.error} />
                </View>
                <Text style={[styles.userPct, { color: colors.foreground }]}>{user.completionRate}%</Text>
              </View>
            ))}
          </>
        )}

        {/* ── APPROVALS ── */}
        {activeTab === "approvals" && (
          <>
            <View style={[styles.approvalInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.approvalInfoText, { color: colors.mutedForeground }]}>
                Review each application and approve or reject. Approved members get immediate access. Rejected members see a reason and can re-apply.
              </Text>
            </View>

            {pendingUsers.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No pending applications</Text>
              </View>
            ) : (
              pendingUsers.map((user) => {
                const roleColor = ROLE_COLORS[user.role];
                return (
                  <View key={user.id} style={[styles.approvalCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: "#fbbf24" }]}>
                    <View style={styles.approvalCardTop}>
                      <View style={[styles.approvalAvatar, { backgroundColor: roleColor + "22" }]}>
                        <Text style={[styles.approvalInitials, { color: roleColor }]}>{user.name.slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.approvalName, { color: colors.foreground }]}>{user.name}</Text>
                        <Text style={[styles.approvalEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
                        <View style={styles.approvalMeta}>
                          <View style={[styles.rolePill, { backgroundColor: roleColor + "22" }]}>
                            <Text style={[styles.rolePillText, { color: roleColor }]}>{ROLE_LABELS[user.role]}</Text>
                          </View>
                          <View style={[styles.pendingPill, { backgroundColor: "#fbbf2422" }]}>
                            <Ionicons name="hourglass-outline" size={10} color="#fbbf24" />
                            <Text style={[styles.pendingPillText, { color: "#fbbf24" }]}>Pending</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {(user.leaderName || user.sponsorName) && (
                      <View style={[styles.approvalRelations, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                        {user.leaderName && (
                          <View style={styles.relationRow}>
                            <Ionicons name="people-outline" size={12} color={colors.mutedForeground} />
                            <Text style={[styles.relationLabel, { color: colors.mutedForeground }]}>Leader:</Text>
                            <Text style={[styles.relationValue, { color: colors.foreground }]}>{user.leaderName}</Text>
                          </View>
                        )}
                        {user.sponsorName && (
                          <View style={styles.relationRow}>
                            <Ionicons name="person-add-outline" size={12} color={colors.mutedForeground} />
                            <Text style={[styles.relationLabel, { color: colors.mutedForeground }]}>Sponsor:</Text>
                            <Text style={[styles.relationValue, { color: colors.foreground }]}>{user.sponsorName}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <Text style={[styles.appliedAt, { color: colors.mutedForeground }]}>
                      Applied: {new Date(user.joinedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Text>

                    <View style={styles.approvalActions}>
                      <TouchableOpacity onPress={() => handleRejectUser(user.id, user.name)} activeOpacity={0.8}
                        style={[styles.rejectBtn, { backgroundColor: colors.error + "12", borderColor: colors.error + "33" }]}>
                        <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                        <Text style={[styles.rejectBtnText, { color: colors.error }]}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        setSelectedUser(user);
                        setAssignedLeaderId("none");
                        setAssignedSponsorName(user.sponsorName || "");
                        setAssignedSponsorId(user.sponsorId || null);
                        setLeaderSearch("");
                        setShowLeaderDropdown(false);
                        setManageModalVisible(true);
                      }} activeOpacity={0.8}
                        style={[styles.approveBtn, { backgroundColor: colors.success }]}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                        <Text style={styles.approveBtnText}>Approve Access</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── EVIDENCE ── */}
        {activeTab === "evidence" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Pending Review</Text>
            {pendingEvidence.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>All evidence reviewed</Text>
              </View>
            ) : (
              pendingEvidence.map((ev: Evidence) => (
                <View key={ev.id} style={[styles.evCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.evHeader}>
                    <View style={[styles.evIcon, { backgroundColor: colors.warning + "22" }]}>
                      <Ionicons name="time" size={16} color={colors.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.evTask, { color: colors.foreground }]} numberOfLines={1}>{ev.taskTitle}</Text>
                      <Text style={[styles.evUser, { color: colors.mutedForeground }]}>By {ev.userName}</Text>
                    </View>
                  </View>
                  <Text style={[styles.evDesc, { color: colors.mutedForeground }]}>{ev.description}</Text>
                  <View style={styles.evActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error + "18", borderColor: colors.error + "44" }]} onPress={() => handleRejectEvidence(ev.id)} activeOpacity={0.8}>
                      <Ionicons name="close" size={16} color={colors.error} />
                      <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success + "18", borderColor: colors.success + "44" }]} onPress={() => handleApproveEvidence(ev.id)} activeOpacity={0.8}>
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                      <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── COMPLIANCE ── */}
        {activeTab === "compliance" && (
          <>
            <View style={[styles.complianceOverview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.compTitle, { color: colors.foreground }]}>Daily Compliance Check</Text>
              <Text style={[styles.compSub, { color: colors.mutedForeground }]}>Runs every day at 11:00 AM. Detects users who did not update goals or complete tasks.</Text>
              <View style={styles.compStats}>
                <View style={styles.compStat}>
                  <Text style={[styles.compStatVal, { color: colors.success }]}>{activeUsers}</Text>
                  <Text style={[styles.compStatLbl, { color: colors.mutedForeground }]}>Compliant</Text>
                </View>
                <View style={styles.compStat}>
                  <Text style={[styles.compStatVal, { color: colors.error }]}>{INACTIVE_USERS.length}</Text>
                  <Text style={[styles.compStatLbl, { color: colors.mutedForeground }]}>Inactive</Text>
                </View>
                <View style={styles.compStat}>
                  <Text style={[styles.compStatVal, { color: colors.foreground }]}>{Math.round((activeUsers / totalUsers) * 100)}%</Text>
                  <Text style={[styles.compStatLbl, { color: colors.mutedForeground }]}>Rate</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Inactive Users — Action Required</Text>
            {INACTIVE_USERS.map((user) => (
              <View key={user.id} style={[styles.inactiveCard, { backgroundColor: colors.card, borderColor: colors.error + "44", borderLeftColor: colors.error }]}>
                <View style={styles.inactiveHeader}>
                  <View style={[styles.userAvatar, { backgroundColor: colors.error + "22" }]}>
                    <Text style={[styles.userInitials, { color: colors.error }]}>{user.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
                    <Text style={[styles.lastSeen, { color: colors.mutedForeground }]}>Last seen: {user.lastSeen}</Text>
                  </View>
                  <View style={[styles.consistencyBadge, { backgroundColor: colors.error + "22" }]}>
                    <Text style={[styles.consistencyText, { color: colors.error }]}>{user.consistency}%</Text>
                  </View>
                </View>
                <Text style={[styles.missedText, { color: colors.mutedForeground }]}>{user.missedTasks} tasks missed this week</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.warning + "22", borderColor: colors.warning + "44" }]} activeOpacity={0.8}>
                    <Ionicons name="notifications" size={13} color={colors.warning} />
                    <Text style={[styles.smallBtnText, { color: colors.warning }]}>Send Reminder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.error + "22", borderColor: colors.error + "44" }]} activeOpacity={0.8}>
                    <Ionicons name="call" size={13} color={colors.error} />
                    <Text style={[styles.smallBtnText, { color: colors.error }]}>Trigger Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Approve & Assign Connections Modal */}
      <Modal visible={manageModalVisible} transparent animationType="slide" onRequestClose={() => setManageModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Approve & Connect Member</Text>
              <TouchableOpacity onPress={() => setManageModalVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
              <View>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Assign Team Leader</Text>
                <TouchableOpacity
                  onPress={() => setShowLeaderDropdown(!showLeaderDropdown)}
                  style={[styles.pickerBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.pickerText, { color: assignedLeaderId !== "none" ? approvedUsers.find(u => u.id === assignedLeaderId)?.name : "Select Team Leader..."} ]}>
                    {assignedLeaderId !== "none" ? approvedUsers.find(u => u.id === assignedLeaderId)?.name : "Select Team Leader..."}
                  </Text>
                  <Ionicons name={showLeaderDropdown ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>

                {showLeaderDropdown && (
                  <View style={{
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    marginTop: 6,
                    backgroundColor: colors.card,
                    maxHeight: 180,
                  }}>
                    <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 180 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setAssignedLeaderId("none");
                          setShowLeaderDropdown(false);
                        }}
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                      >
                        <Text style={{ color: colors.mutedForeground, fontStyle: "italic", fontSize: 14 }}>None / No Leader</Text>
                      </TouchableOpacity>
                      {approvedUsers.map((u) => (
                        <TouchableOpacity
                          key={`lead-select-${u.id}`}
                          onPress={() => {
                            setAssignedLeaderId(u.id);
                            setShowLeaderDropdown(false);
                          }}
                          style={{
                            padding: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <Text style={{ color: colors.foreground, fontSize: 14 }}>{u.name} ({ROLE_LABELS[u.role] || u.role})</Text>
                          {assignedLeaderId === u.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Sponsor</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Ionicons name="person-add-outline" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Type sponsor's name..."
                    placeholderTextColor={colors.mutedForeground}
                    value={assignedSponsorName}
                    onChangeText={(text) => {
                      setAssignedSponsorName(text);
                      setAssignedSponsorId(null);
                    }}
                  />
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4, lineHeight: 16 }}>
                  If the sponsor matches an existing approved member's name exactly, they will be automatically linked.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSaveConnection}
                activeOpacity={0.8}
                style={[styles.btn, { backgroundColor: colors.primary, marginTop: 10, paddingVertical: 14 }]}
              >
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Confirm & Approve</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  adminBanner: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  adminText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabsRow: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, flexDirection: "row", justifyContent: "center", gap: 4 },
  tabText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tabBadge: { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  pendingAlert: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  pendingAlertTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  pendingAlertSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 },
  userRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, gap: 12, marginBottom: 8 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  userInitials: { fontSize: 13, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  userPct: { fontSize: 13, fontFamily: "Inter_700Bold" },
  approvalInfo: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  approvalInfoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  approvalCard: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 12, gap: 10 },
  approvalCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  approvalAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  approvalInitials: { fontSize: 16, fontFamily: "Inter_700Bold" },
  approvalName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  approvalEmail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  approvalMeta: { flexDirection: "row", gap: 8, marginTop: 6 },
  rolePill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  rolePillText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  pendingPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  pendingPillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  approvalRelations: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 6 },
  relationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  relationLabel: { fontSize: 11, fontFamily: "Inter_500Medium", width: 50 },
  relationValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  appliedAt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  approvalActions: { flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 11 },
  rejectBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  approveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 11 },
  approveBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  empty: { borderRadius: 14, padding: 32, borderWidth: 1, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  evCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },
  evHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  evIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  evTask: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  evUser: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  evDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  evActions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 10 },
  actionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  complianceOverview: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20, gap: 10 },
  compTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  compSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  compStats: { flexDirection: "row", justifyContent: "space-around" },
  compStat: { alignItems: "center", gap: 4 },
  compStatVal: { fontSize: 24, fontFamily: "Inter_700Bold" },
  compStatLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  inactiveCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10, gap: 8 },
  inactiveHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  lastSeen: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  consistencyBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  consistencyText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  missedText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 10 },
  smallBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 8, borderWidth: 1, paddingVertical: 8 },
  smallBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalBackdrop: { flex: 1, backgroundColor: "#00000066", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  pickerBtn: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  pickerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 16 },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
