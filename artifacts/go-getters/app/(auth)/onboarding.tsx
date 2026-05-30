import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "flash" as const,
    title: "Execute Every Day",
    subtitle: "Set weekly goals, break them into daily tasks, and build the habit of consistent execution.",
    color: "#00d8fe",
  },
  {
    id: "2",
    icon: "trending-up" as const,
    title: "Track Your Progress",
    subtitle: "Streak systems, completion rates, and real-time analytics keep you focused on what matters most.",
    color: "#00e57d",
  },
  {
    id: "3",
    icon: "trophy" as const,
    title: "Get Recognized",
    subtitle: "Weekly achievers, leaderboards, and badges celebrate your consistency and drive.",
    color: "#fbbf24",
  },
  {
    id: "4",
    icon: "people" as const,
    title: "Rise Together",
    subtitle: "Stay connected with your team. Share wins, celebrate growth, and hold each other accountable.",
    color: "#a855f7",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = activeIndex === SLIDES.length - 1;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleNext() {
    if (isLast) {
      router.replace("/(auth)/login");
      return;
    }
    const next = activeIndex + 1;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  }

  function handleSkip() {
    router.replace("/(auth)/login");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.skipRow}>
        {!isLast ? (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={[styles.skip, { color: colors.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
        ) : <View />}
        <View style={[styles.logoWrap, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
          <Text style={[styles.logoText, { color: colors.primary }]}>GG</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + "18", borderColor: item.color + "33" }]}>
              <View style={[styles.iconInner, { backgroundColor: item.color + "33" }]}>
                <Ionicons name={item.icon} size={52} color={item.color} />
              </View>
            </View>
            <Text style={[styles.slideTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.slideSubtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
          </View>
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === activeIndex ? colors.primary : colors.border, width: i === activeIndex ? 20 : 8 }]} />
        ))}
      </View>

      <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleNext} activeOpacity={0.85}>
        <Text style={[styles.nextText, { color: colors.primaryForeground }]}>
          {isLast ? "Get Started" : "Continue"}
        </Text>
        <Ionicons name={isLast ? "arrow-forward" : "chevron-forward"} size={18} color={colors.primaryForeground} />
      </TouchableOpacity>

      {isLast && (
        <TouchableOpacity onPress={() => router.replace("/(auth)/register")} style={styles.registerRow} activeOpacity={0.7}>
          <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
            New here?{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Create Account</Text>
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  skipRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 },
  skip: { fontSize: 14, fontFamily: "Inter_500Medium" },
  logoWrap: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  logoText: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 20 },
  iconCircle: { width: 180, height: 180, borderRadius: 90, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 16 },
  iconInner: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  slideTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  slideSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 24, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 16, gap: 8, marginBottom: 16 },
  nextText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  registerRow: { alignItems: "center", marginBottom: 8 },
  registerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
