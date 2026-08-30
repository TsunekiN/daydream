import { NavigationContainer, DefaultTheme, DarkTheme, type NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, useEffect } from "react";
import { ThemeProvider, useTheme, type ThemeColors } from "./lib/ThemeContext";
import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import NovelDetailScreen from "./screens/NovelDetailScreen";
import ReaderScreen from "./screens/ReaderScreen";
import SettingsScreen from "./screens/SettingsScreen";

export type RootStackParamList = {
  Home: undefined;
  Search: undefined;
  NovelDetail: { ncode: string; site: string };
  Reader: { ncode: string; episode: number; site: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { isDark, colors } = useTheme();

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.card, text: colors.text, border: colors.border, primary: colors.accent } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.card, text: colors.text, border: colors.border, primary: colors.accent } };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer ref={navRef} theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "600", fontSize: 16 },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: "お気に入りリスト", headerBackVisible: false }} />
          <Stack.Screen name="Search" component={SearchScreen} options={{ title: "検索" }} />
          <Stack.Screen name="NovelDetail" component={NovelDetailScreen} options={{ title: "作品情報" }} />
          <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "設定" }} />
        </Stack.Navigator>
      </NavigationContainer>
      <SettingsFab navRef={navRef} isDark={isDark} colors={colors} />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function SettingsFab({ navRef, isDark, colors }: { navRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>; isDark: boolean; colors: ThemeColors }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const unsubscribe = navRef.current?.addListener?.("state", () => {
      const route = navRef.current?.getCurrentRoute();
      setVisible(route?.name !== "Reader" && route?.name !== "Settings");
    });
    return unsubscribe;
  }, [navRef]);

  if (!visible) return null;

  const handlePress = () => {
    navRef.current?.navigate("Settings");
  };

  return (
    <TouchableOpacity
      style={[fabStyles.fab, { backgroundColor: isDark ? "rgba(100,100,110,0.9)" : "rgba(255,255,255,0.9)" }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons name="settings-outline" size={18} color={isDark ? "#F0F0F0" : "#555"} />
    </TouchableOpacity>
  );
}

const fabStyles = StyleSheet.create({
  fab: {
    position: "absolute", top: 52, right: 12,
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    elevation: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    zIndex: 999,
  },
});
