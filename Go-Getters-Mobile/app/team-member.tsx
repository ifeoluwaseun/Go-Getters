import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, FlatList, TextInput,
  TouchableOpacity, Alert, Platform, KeyboardAvoidingView, Modal,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { ProgressBar } from "@/components/ProgressBar";
import { MemberStatus, TaskStatus, TeamMessage } from "@/types";

const STATUS_CFG: Record<MemberStatus, { label: string; color: string; icon: string }> = {
  active: { label: "Active", color: "#00e57d", icon: "checkmark-circle" },
  "at-risk": { label: "At Risk", color: "#fbbf24", icon: "warning" },
  inactive: { label: "Inactive", color: "#ef4444", icon: "alert-circle" },
};
const TASK_CFG: Record<TaskStatus, { color: string; icon: string; label: string }> = {
  completed: { color: "#00e57d", icon: "checkmark-circle", label: "Completed" },
  pending: { color: "#fbbf24", icon: "time-outline", label: "Pending" },
  overdue: { color: "#ef4444", icon: "alert-circle", label: "Overdue" },
  skipped: { color: "#6b7280", icon: "close-circle-outline", label: "Skipped" },
};
const EV_CFG: Record<string, { color: string; label: string }> = {
  approved: { color: "#00e57d", label: "Approved" },
  pending: { color: "#fbbf24", label: "Needs Review" },
  rejected: { color: "#ef4444", label: "Rejected" },
};
const EV_ICONS: Record<string, string> = {
  image: "image-outline",
  screenshot: "phone-portrait-outline",
  link: "link-outline",
  voice: "mic-outline",
};
const PRIORITY_COLORS = { high: "#ef4444", medium: "#fbbf24", low: "#6b7280" };
const PRIORITY_LABELS = { high: "High", medium: "Medium", low: "Low" };
const ROLE_COLORS = { admin: "#a855f7", leader: "#00d8fe", sponsor: "#ff6b35", member: "#6b7280" };
const ROLE_LABELS = { admin: "Admin", leader: "Leader", sponsor: "Sponsor", member: "Member" };
const MSG_CFG: Record<TeamMessage["type"], { color: string; label: string; icon: string }> = {
  message: { color: "#00d8fe", label: "Message", icon: "chatbubble-outline" },
  note: { color: "#a855f7", label: "Note", icon: "create-outline" },
  reminder: { color: "#fbbf24", label: "Reminder", icon: "notifications-outline" },
};

const TABS = ["Overview", "Tasks", "Goals", "Evidence", "Messages"] as const;
type Tab = typeof TABS[number];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function TeamMemberScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { teamMembers, teamMessages, sendTeamMessage, approveEvidence, rejectEvidence } = useApp();
  const { currentUser, allUsers, adminUpdateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [msgText, setMsgText] = useState("");

  // Connection states for Admin manage modal
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [assignedLeaderId, setAssignedLeaderId] = useState("none");
  const [assignedSponsorName, setAssignedSponsorName] = useState("");
  const [assignedSponsorId, setAssignedSponsorId] = useState<string | null>(null);
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false);

  const approvedUsers = (allUsers || []).filter(u => u.status === 'approved');

  const handleSaveConnection = async () => {
    if (!member) return;
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

      await adminUpdateUser(member.id, {
        leaderId: leaderId || undefined,
        leaderName: leaderName || undefined,
        sponsorId: sponsorId || undefined,
        sponsorName: sponsorName || undefined
      });

      setManageModalVisible(false);
      Alert.alert("Success", "Member connections updated successfully.");
    } catch (err) {
      console.error("Failed to save connections:", err);
      Alert.alert("Error", "Failed to update member connections.");
    }
  };
  const [msgType, setMsgType] = useState<TeamMessage["type"]>("message");
  const listRef = useRef<FlatList>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [pendingRejectEvId, setPendingRejectEvId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const member = teamMembers.find((m) => m.id === id);

  if (!member) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Ionicons name="person-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Member not found</Text>
      </View>
    );
  }

  const statusConf = STATUS_CFG[member.status];
  const roleColor = ROLE_COLORS[member.role];
  const completedTasks = member.tasks.filter((t) => t.status === "completed").length;
  const overdueTasks = member.tasks.filter((t) => t.status === "overdue").length;
  const pendingEvidence = member.evidence.filter((e) => e.status === "pending").length;
  const avgGoalProgress = member.goals.length > 0
    ? Math.round(member.goals.reduce((a, g) => a + g.progress, 0) / member.goals.length)
    : 0;
  const messages = teamMessages[member.id] || [];

  function handleSendReminder() {
    if (!member) return;
    Alert.alert("Reminder Sent", `A notification has been sent to ${member.name}.`);
  }
  function handleScheduleCall() {
    if (!member) return;
    Alert.alert("Call Scheduled", `${member.name} will receive a calendar invite.`);
  }
  function handleSend() {
    if (!member) return;
    const trimmed = msgText.trim();
    if (!trimmed || !currentUser) return;
    sendTeamMessage(member.id, trimmed, currentUser.id, currentUser.name, msgType);
    setMsgText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }
  function handleApprove(evId: string) {
    Alert.alert("Approve Evidence", "Mark this evidence as approved?", [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => approveEvidence(evId) },
    ]);
  }
  function handleReject(evId: string) {
    setPendingRejectEvId(evId);
    setRejectFeedback("");
    setRejectModalVisible(true);
  }
  function submitRejection() {
    if (!pendingRejectEvId) return;
    const trimmedFeedback = rejectFeedback.trim();
    if (!trimmedFeedback) {
      Alert.alert("Feedback Required", "Please provide a reason for rejecting the evidence.");
      return;
    }
    rejectEvidence(pendingRejectEvId, trimmedFeedback);
    setRejectModalVisible(false);
    setPendingRejectEvId(null);
    setRejectFeedback("");
  }

  const tabBadges: Record<Tab, number | null> = {
    Overview: null,
    Tasks: overdueTasks > 0 ? overdueTasks : null,
    Goals: null,
    Evidence: pendingEvidence > 0 ? pendingEvidence : null,
    Messages: messages.length > 0 ? messages.length : null,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.heroAvatar, { backgroundColor: roleColor + "33", borderColor: roleColor + "55", borderWidth: 2 }]}>
          <Text style={[styles.heroInitials, { color: roleColor }]}>{member.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={[styles.heroName, { color: colors.foreground }]}>{member.name}</Text>
          <View style={styles.heroMeta}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + "22" }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABELS[member.role]}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConf.color + "22" }]}>
              <Ionicons name={statusConf.icon as any} size={11} color={statusConf.color} />
              <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
            </View>
          </View>
          <Text style={[styles.heroEmail, { color: colors.mutedForeground }]}>{member.email}</Text>
          <Text style={[styles.heroJoined, { color: colors.mutedForeground }]}>Joined {new Date(member.joinedAt).toLocaleDateString([], { month: "long", year: "numeric" })} · {member.lastActive}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]} onPress={handleSendReminder} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={15} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Remind</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#fbbf2418", borderColor: "#fbbf2444" }]} onPress={handleScheduleCall} activeOpacity={0.8}>
          <Ionicons name="call-outline" size={15} color="#fbbf24" />
          <Text style={[styles.actionText, { color: "#fbbf24" }]}>Schedule Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#a855f718", borderColor: "#a855f744" }]} onPress={() => setActiveTab("Messages")} activeOpacity={0.8}>
          <Ionicons name="chatbubble-outline" size={15} color="#a855f7" />
          <Text style={[styles.actionText, { color: "#a855f7" }]}>Message</Text>
        </TouchableOpacity>
        {currentUser?.role === "admin" && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#00d8fe18", borderColor: "#00d8fe44" }]}
            onPress={() => {
              setAssignedLeaderId(member.leaderId || "none");
              setAssignedSponsorName(member.sponsorName || "");
              setAssignedSponsorId(member.sponsorId || null);
              setShowLeaderDropdown(false);
              setManageModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={15} color="#00d8fe" />
            <Text style={[styles.actionText, { color: "#00d8fe" }]}>Manage</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => {
          const badge = tabBadges[tab];
          return (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} activeOpacity={0.8}
              style={[styles.tab, { borderBottomColor: activeTab === tab ? colors.primary : "transparent", borderBottomWidth: 2 }]}>
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>{tab}</Text>
              {badge !== null && <View style={[styles.tabBadge, { backgroundColor: tab === "Evidence" ? "#fbbf24" : tab === "Messages" ? colors.primary : colors.error }]}><Text style={styles.tabBadgeText}>{badge}</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Messages tab gets its own layout */}
      {activeTab === "Messages" ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 150 : 0}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 12, flexGrow: 1 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={[styles.msgEmpty, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.msgEmptyTitle, { color: colors.foreground }]}>No messages yet</Text>
                <Text style={[styles.msgEmptyDesc, { color: colors.mutedForeground }]}>Send {member.name} a message, note, or reminder below.</Text>
              </View>
            }
            renderItem={({ item }: { item: TeamMessage }) => {
              const conf = MSG_CFG[item.type];
              const isMe = item.senderId === currentUser?.id;
              return (
                <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                  {!isMe && (
                    <View style={[styles.msgAvatar, { backgroundColor: "#6b728033" }]}>
                      <Text style={[styles.msgAvatarText, { color: "#6b7280" }]}>{item.senderName.slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ maxWidth: "75%" }}>
                    <View style={[styles.msgBubble, { backgroundColor: isMe ? colors.primary : colors.card, borderColor: isMe ? colors.primary : colors.border }]}>
                      {!isMe && <Text style={[styles.msgSender, { color: colors.mutedForeground }]}>{item.senderName}</Text>}
                      <View style={styles.msgTypeRow}>
                        <View style={[styles.msgTypePill, { backgroundColor: isMe ? "#ffffff22" : conf.color + "22" }]}>
                          <Ionicons name={conf.icon as any} size={10} color={isMe ? "#fff" : conf.color} />
                          <Text style={[styles.msgTypeText, { color: isMe ? "#fff" : conf.color }]}>{conf.label}</Text>
                        </View>
                      </View>
                      <Text style={[styles.msgContent, { color: isMe ? "#fff" : colors.foreground }]}>{item.content}</Text>
                    </View>
                    <Text style={[styles.msgTime, { color: colors.mutedForeground, alignSelf: isMe ? "flex-end" : "flex-start" }]}>{formatDate(item.sentAt)}</Text>
                  </View>
                  {isMe && (
                    <View style={[styles.msgAvatar, { backgroundColor: colors.primary + "33" }]}>
                      <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                    </View>
                  )}
                </View>
              );
            }}
          />
          {/* Message type selector + input */}
          <View style={[styles.msgInputArea, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: botPad + 8 }]}>
            <View style={styles.msgTypeSelector}>
              {(["message", "note", "reminder"] as TeamMessage["type"][]).map((t) => {
                const c = MSG_CFG[t];
                return (
                  <TouchableOpacity key={t} onPress={() => setMsgType(t)} activeOpacity={0.8}
                    style={[styles.typePill, { backgroundColor: msgType === t ? c.color + "22" : colors.muted, borderColor: msgType === t ? c.color : colors.border }]}>
                    <Ionicons name={c.icon as any} size={12} color={msgType === t ? c.color : colors.mutedForeground} />
                    <Text style={[styles.typePillText, { color: msgType === t ? c.color : colors.mutedForeground }]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.msgInputRow}>
              <TextInput
                style={[styles.msgInput, { backgroundColor: colors.muted, color: colors.foreground }]}
                placeholder={`${MSG_CFG[msgType].label} to ${member.name}...`}
                placeholderTextColor={colors.mutedForeground}
                value={msgText}
                onChangeText={setMsgText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleSend}
                activeOpacity={0.85}
                style={[styles.sendBtn, { backgroundColor: msgText.trim() ? colors.primary : colors.muted }]}
              >
                <Ionicons name="send" size={18} color={msgText.trim() ? colors.primaryForeground : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>

          {/* ── OVERVIEW ── */}
          {activeTab === "Overview" && (
            <>
              <View style={styles.statsGrid}>
                {[
                  { label: "Streak", value: `${member.streak}d`, icon: "flame", color: "#ff6b35" },
                  { label: "Points", value: member.points.toLocaleString(), icon: "star", color: "#fbbf24" },
                  { label: "Completion", value: `${member.completionRate}%`, icon: "checkmark-circle", color: "#00e57d" },
                  { label: "Consistency", value: `${member.consistency}%`, icon: "trending-up", color: colors.primary },
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

              <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Performance Breakdown</Text>
                <ProgressBar progress={member.completionRate} label="Task Completion Rate" showLabel color={member.completionRate >= 80 ? "#00e57d" : "#fbbf24"} />
                <ProgressBar progress={member.consistency} label="Consistency Score" showLabel color={colors.primary} />
                <ProgressBar progress={avgGoalProgress} label="Goal Progress (avg)" showLabel color="#a855f7" />
              </View>

              <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today at a Glance</Text>
                <View style={styles.glanceRow}>
                  {[
                    { val: completedTasks, label: "Done", color: "#00e57d" },
                    { val: member.tasks.filter((t) => t.status === "pending").length, label: "Pending", color: "#fbbf24" },
                    { val: overdueTasks, label: "Overdue", color: "#ef4444" },
                    { val: pendingEvidence, label: "Evidence", color: colors.primary },
                    { val: member.goals.length, label: "Goals", color: "#a855f7" },
                  ].map((g) => (
                    <View key={g.label} style={styles.glanceItem}>
                      <Text style={[styles.glanceVal, { color: g.color }]}>{g.val}</Text>
                      <Text style={[styles.glanceLbl, { color: colors.mutedForeground }]}>{g.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {overdueTasks > 0 && (
                <View style={[styles.alertBox, { backgroundColor: "#ef444412", borderColor: "#ef444433" }]}>
                  <Ionicons name="warning" size={18} color="#ef4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: "#ef4444" }]}>Attention Needed</Text>
                    <Text style={[styles.alertBody, { color: "#ef4444" }]}>{member.name} has {overdueTasks} overdue task{overdueTasks > 1 ? "s" : ""} today. Consider reaching out to help them get back on track.</Text>
                  </View>
                </View>
              )}

              <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Member Info</Text>
                {[
                  { icon: "mail-outline", label: "Email", value: member.email },
                  { icon: "calendar-outline", label: "Joined", value: new Date(member.joinedAt).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" }) },
                  { icon: "time-outline", label: "Last Active", value: member.lastActive },
                  { icon: "ribbon-outline", label: "Title", value: member.title ?? "Go-Getter" },
                ].map((row) => (
                  <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                    <Ionicons name={row.icon as any} size={15} color={colors.mutedForeground} />
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── TASKS ── */}
          {activeTab === "Tasks" && (
            <>
              <View style={styles.tabHeader}>
                <Text style={[styles.tabHeaderTitle, { color: colors.foreground }]}>{member.tasks.length} Tasks Today</Text>
                <View style={styles.tabHeaderStats}>
                  <Text style={[styles.tabHeaderStat, { color: "#00e57d" }]}>{completedTasks} done</Text>
                  {overdueTasks > 0 && <Text style={[styles.tabHeaderStat, { color: "#ef4444" }]}>{overdueTasks} overdue</Text>}
                </View>
              </View>

              {member.tasks.length === 0 ? (
                <EmptyState icon="list-outline" text="No tasks today" />
              ) : (
                member.tasks.map((task) => {
                  const conf = TASK_CFG[task.status];
                  return (
                    <View key={task.id} style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: conf.color }]}>
                      <View style={styles.taskCardTop}>
                        <View style={[styles.taskStatusIcon, { backgroundColor: conf.color + "22" }]}>
                          <Ionicons name={conf.icon as any} size={16} color={conf.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.taskTitle, { color: colors.foreground }]}>{task.title}</Text>
                          <View style={[styles.taskStatusBadge, { backgroundColor: conf.color + "18" }]}>
                            <Text style={[styles.taskStatusLabel, { color: conf.color }]}>{conf.label}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.taskMeta}>
                        <View style={[styles.priorityPill, { backgroundColor: PRIORITY_COLORS[task.priority] + "22", borderColor: PRIORITY_COLORS[task.priority] + "44" }]}>
                          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                          <Text style={[styles.priorityLabel, { color: PRIORITY_COLORS[task.priority] }]}>{PRIORITY_LABELS[task.priority]} Priority</Text>
                        </View>
                        <View style={[styles.categoryPill, { backgroundColor: colors.muted }]}>
                          <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>{task.category}</Text>
                        </View>
                      </View>

                      {(task.dueTime || task.completedAt) && (
                        <View style={styles.taskTimes}>
                          {task.dueTime && (
                            <View style={styles.timeRow}>
                              <Ionicons name="alarm-outline" size={12} color={colors.mutedForeground} />
                              <Text style={[styles.timeText, { color: colors.mutedForeground }]}>Due {task.dueTime}</Text>
                            </View>
                          )}
                          {task.completedAt && (
                            <View style={styles.timeRow}>
                              <Ionicons name="checkmark-circle-outline" size={12} color="#00e57d" />
                              <Text style={[styles.timeText, { color: "#00e57d" }]}>Completed at {formatTime(task.completedAt)}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {task.description && (
                        <Text style={[styles.taskDesc, { color: colors.mutedForeground }]}>{task.description}</Text>
                      )}

                      <View style={styles.taskFooter}>
                        {task.recurring && (
                          <View style={[styles.recurringPill, { backgroundColor: colors.primary + "18" }]}>
                            <Ionicons name="repeat" size={11} color={colors.primary} />
                            <Text style={[styles.recurringText, { color: colors.primary }]}>Recurring</Text>
                          </View>
                        )}
                        {task.hasEvidence && (
                          <View style={[styles.evidencePill, { backgroundColor: "#00e57d18" }]}>
                            <Ionicons name="camera" size={11} color="#00e57d" />
                            <Text style={[styles.evidenceText, { color: "#00e57d" }]}>Evidence submitted</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* ── GOALS ── */}
          {activeTab === "Goals" && (
            <>
              <View style={styles.tabHeader}>
                <Text style={[styles.tabHeaderTitle, { color: colors.foreground }]}>{member.goals.length} Active Goal{member.goals.length !== 1 ? "s" : ""}</Text>
                <Text style={[styles.tabHeaderStat, { color: "#a855f7" }]}>{avgGoalProgress}% avg progress</Text>
              </View>

              {member.goals.length === 0 ? (
                <EmptyState icon="flag-outline" text="No goals set this week" />
              ) : (
                member.goals.map((goal) => {
                  const linkedTasks = member.tasks.filter((t) => goal.taskIds.includes(t.id));
                  return (
                    <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: goal.color }]}>
                      <View style={styles.goalTop}>
                        <View style={[styles.goalColorDot, { backgroundColor: goal.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.goalTitle, { color: colors.foreground }]}>{goal.title}</Text>
                          <View style={[styles.categoryPill, { backgroundColor: goal.color + "18" }]}>
                            <Text style={[styles.categoryLabel, { color: goal.color }]}>{goal.category}</Text>
                          </View>
                        </View>
                        <View style={[styles.goalPctBadge, { backgroundColor: goal.color + "22" }]}>
                          <Text style={[styles.goalPct, { color: goal.color }]}>{goal.progress}%</Text>
                        </View>
                      </View>

                      <Text style={[styles.goalDesc, { color: colors.mutedForeground }]}>{goal.description}</Text>
                      <ProgressBar progress={goal.progress} height={8} color={goal.color} />

                      {linkedTasks.length > 0 && (
                        <View style={styles.linkedTasks}>
                          <Text style={[styles.linkedTitle, { color: colors.mutedForeground }]}>LINKED TASKS ({linkedTasks.length})</Text>
                          {linkedTasks.map((t) => {
                            const tc = TASK_CFG[t.status];
                            return (
                              <View key={t.id} style={[styles.linkedTaskRow, { borderTopColor: colors.border }]}>
                                <Ionicons name={tc.icon as any} size={13} color={tc.color} />
                                <Text style={[styles.linkedTaskText, { color: colors.foreground }]}>{t.title}</Text>
                                <Text style={[styles.linkedTaskStatus, { color: tc.color }]}>{tc.label}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* ── EVIDENCE ── */}
          {activeTab === "Evidence" && (
            <>
              <View style={styles.tabHeader}>
                <Text style={[styles.tabHeaderTitle, { color: colors.foreground }]}>{member.evidence.length} Submission{member.evidence.length !== 1 ? "s" : ""}</Text>
                {pendingEvidence > 0 && <Text style={[styles.tabHeaderStat, { color: "#fbbf24" }]}>{pendingEvidence} need review</Text>}
              </View>

              {member.evidence.length === 0 ? (
                <EmptyState icon="camera-outline" text="No evidence submitted yet" />
              ) : (
                member.evidence.map((ev) => {
                  const conf = EV_CFG[ev.status];
                  return (
                    <View key={ev.id} style={[styles.evCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: conf.color }]}>
                      <View style={styles.evHeader}>
                        <View style={[styles.evIcon, { backgroundColor: conf.color + "22" }]}>
                          <Ionicons name={EV_ICONS[ev.type] as any} size={16} color={conf.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.evTask, { color: colors.foreground }]} numberOfLines={1}>{ev.taskTitle}</Text>
                          <View style={styles.evMeta}>
                            <Text style={[styles.evMetaText, { color: colors.mutedForeground }]}>{ev.type.toUpperCase()}</Text>
                            <Text style={[styles.evMetaText, { color: colors.mutedForeground }]}>·</Text>
                            <Text style={[styles.evMetaText, { color: colors.mutedForeground }]}>{formatDate(ev.uploadedAt)}</Text>
                          </View>
                        </View>
                        <View style={[styles.evStatusChip, { backgroundColor: conf.color + "22" }]}>
                          <Text style={[styles.evStatusText, { color: conf.color }]}>{conf.label}</Text>
                        </View>
                      </View>

                      <Text style={[styles.evDesc, { color: colors.foreground }]}>{ev.description}</Text>

                      {ev.feedback && (
                        <View style={[styles.feedbackBox, { backgroundColor: "#ef444412", borderColor: "#ef444430" }]}>
                          <Ionicons name="information-circle-outline" size={13} color="#ef4444" />
                          <Text style={[styles.feedbackText, { color: "#ef4444" }]}>{ev.feedback}</Text>
                        </View>
                      )}

                      {ev.status === "pending" && (
                        <View style={styles.evActions}>
                          <TouchableOpacity onPress={() => handleApprove(ev.id)} activeOpacity={0.8}
                            style={[styles.evActionBtn, { backgroundColor: "#00e57d18", borderColor: "#00e57d44" }]}>
                            <Ionicons name="checkmark-circle-outline" size={15} color="#00e57d" />
                            <Text style={[styles.evActionText, { color: "#00e57d" }]}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleReject(ev.id)} activeOpacity={0.8}
                            style={[styles.evActionBtn, { backgroundColor: "#ef444412", borderColor: "#ef444430" }]}>
                            <Ionicons name="close-circle-outline" size={15} color="#ef4444" />
                            <Text style={[styles.evActionText, { color: "#ef4444" }]}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Rejection Feedback Dialog Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={rejectModalVisible}
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Reject Evidence</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Provide constructive feedback to help the member understand what needs correction:
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="E.g., Screenshot is blurry, please upload a clear one."
              placeholderTextColor={colors.mutedForeground}
              value={rejectFeedback}
              onChangeText={setRejectFeedback}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.error }]}
                onPress={submitRejection}
              >
                <Text style={[styles.modalBtnText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin Manage Connections Modal */}
      <Modal visible={manageModalVisible} transparent animationType="slide" onRequestClose={() => setManageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, width: "100%", maxWidth: 360 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 10 }}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Manage Member Connections</Text>
              <TouchableOpacity onPress={() => setManageModalVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16, paddingTop: 10 }} keyboardShouldPersistTaps="handled">
              <View>
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 6 }}>Assign Team Leader</Text>
                <TouchableOpacity
                  onPress={() => setShowLeaderDropdown(!showLeaderDropdown)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 12,
                    borderWidth: 1,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                  <Text style={{ color: assignedLeaderId !== "none" ? colors.foreground : colors.mutedForeground, flex: 1, fontSize: 14 }}>
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
                          key={`lead-select-tm-${u.id}`}
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
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 6 }}>Sponsor</Text>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 12,
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  gap: 10
                }}>
                  <Ionicons name="person-add-outline" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={{ flex: 1, color: colors.foreground, fontSize: 14 }}
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
                style={{
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  backgroundColor: colors.primary,
                  marginTop: 10
                }}
              >
                <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.primaryForeground }}>Save Connections</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  const colors = useColors();
  return (
    <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon as any} size={36} color={colors.mutedForeground} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  hero: { flexDirection: "row", padding: 16, gap: 14, borderBottomWidth: 1 },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  heroInitials: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4 },
  heroMeta: { flexDirection: "row", gap: 8, marginBottom: 3 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  roleText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  heroEmail: { fontSize: 11, fontFamily: "Inter_400Regular" },
  heroJoined: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  actionBar: { flexDirection: "row", gap: 8, padding: 10, borderBottomWidth: 1 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10, borderWidth: 1, paddingVertical: 9 },
  actionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabsRow: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, flexDirection: "row", justifyContent: "center", gap: 3 },
  tabText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tabBadge: { borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  tabBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statCard: { width: "47%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  section: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  glanceRow: { flexDirection: "row", justifyContent: "space-around" },
  glanceItem: { alignItems: "center", gap: 3 },
  glanceVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  glanceLbl: { fontSize: 10, fontFamily: "Inter_500Medium" },
  alertBox: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  alertTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 3 },
  alertBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  infoLabel: { fontSize: 12, fontFamily: "Inter_500Medium", width: 75 },
  infoValue: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  tabHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  tabHeaderTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  tabHeaderStats: { flexDirection: "row", gap: 10 },
  tabHeaderStat: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  taskCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10, gap: 10 },
  taskCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  taskStatusIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  taskTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  taskStatusBadge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  taskStatusLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  taskMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  priorityPill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  categoryPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  categoryLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  taskTimes: { gap: 4 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  timeText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  taskDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  taskFooter: { flexDirection: "row", gap: 8 },
  recurringPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  recurringText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  evidencePill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  evidenceText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  goalCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 16, marginBottom: 12, gap: 10 },
  goalTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  goalColorDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  goalTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  goalPctBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  goalPct: { fontSize: 16, fontFamily: "Inter_700Bold" },
  goalDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  linkedTasks: { gap: 0, marginTop: 4 },
  linkedTitle: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5, marginBottom: 6 },
  linkedTaskRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderTopWidth: 1 },
  linkedTaskText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  linkedTaskStatus: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  evCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10, gap: 10 },
  evHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  evIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  evTask: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  evMeta: { flexDirection: "row", gap: 5, marginTop: 2 },
  evMetaText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  evStatusChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  evStatusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  evDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  feedbackBox: { flexDirection: "row", gap: 6, borderRadius: 8, borderWidth: 1, padding: 10 },
  feedbackText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  evActions: { flexDirection: "row", gap: 10 },
  evActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 10 },
  evActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  msgEmpty: { flex: 1, margin: 20, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  msgEmptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  msgEmptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  msgRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  msgRowLeft: { justifyContent: "flex-start" },
  msgRowRight: { justifyContent: "flex-end" },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  msgAvatarText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  msgBubble: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 6 },
  msgSender: { fontSize: 10, fontFamily: "Inter_700Bold" },
  msgTypeRow: { flexDirection: "row" },
  msgTypePill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  msgTypeText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  msgContent: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  msgTime: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  msgInputArea: { borderTopWidth: 1, padding: 10, gap: 8 },
  msgTypeSelector: { flexDirection: "row", gap: 8 },
  typePill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  typePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  msgInputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", maxWidth: 340, borderRadius: 16, borderWidth: 1, padding: 20, gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  modalInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular", textAlignVertical: "top", height: 80 },
  modalButtons: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
