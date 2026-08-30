import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import NativeSlider from "@react-native-community/slider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useTheme } from "../lib/ThemeContext";
import {
  FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS, EXCLUDE_PRESETS,
  type AppSettings, type ReaderFontFamily, type ReaderFontSize,
} from "../lib/settings";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { colors, settings, updateSettings, updateReaderSettings } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>

      {/* Theme */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>テーマ</Text>
        <View style={styles.chipRow}>
          {([["light", "☀️ ライト"], ["dark", "🌙 ダーク"], ["system", "📱 システム"]] as const).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, { backgroundColor: colors.border }, settings.theme === key && styles.chipActive]}
              onPress={() => updateSettings({ theme: key })}
            >
              <Text style={[styles.chipText, { color: colors.textSub }, settings.theme === key && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Exclude Filter */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>除外フィルタ</Text>
        <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>検索結果から女性向け作品を除外する強度</Text>
        <View style={styles.chipRow}>
          {(Object.entries(EXCLUDE_PRESETS) as [string, { label: string }][]).map(([key, { label }]) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, { backgroundColor: colors.border }, settings.excludePreset === key && styles.chipActive]}
              onPress={() => updateSettings({ excludePreset: key as AppSettings["excludePreset"] })}
            >
              <Text style={[styles.chipText, { color: colors.textSub }, settings.excludePreset === key && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Layout */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>表示方向</Text>
        <View style={styles.chipRow}>
          {([["vertical", "縦書き"], ["horizontal", "横書き"]] as const).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, { backgroundColor: colors.border }, settings.reader.layout === key && styles.chipActive]}
              onPress={() => updateReaderSettings({ layout: key })}
            >
              <Text style={[styles.chipText, { color: colors.textSub }, settings.reader.layout === key && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Font Family */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>書体</Text>
        <View style={styles.chipRow}>
          {(Object.entries(FONT_FAMILY_OPTIONS) as [ReaderFontFamily, { label: string; css: string }][]).map(([key, { label }]) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, { backgroundColor: colors.border }, settings.reader.fontFamily === key && styles.chipActive]}
              onPress={() => updateReaderSettings({ fontFamily: key })}
            >
              <Text style={[styles.chipText, { color: colors.textSub }, settings.reader.fontFamily === key && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Font Size */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>文字サイズ</Text>
        <View style={styles.chipRow}>
          {(Object.entries(FONT_SIZE_OPTIONS) as [ReaderFontSize, { label: string; px: number }][]).map(([key, { label }]) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, { backgroundColor: colors.border }, settings.reader.fontSize === key && styles.chipActive]}
              onPress={() => updateReaderSettings({ fontSize: key })}
            >
              <Text style={[styles.chipText, { color: colors.textSub }, settings.reader.fontSize === key && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Line Height */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.sliderHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>行間</Text>
          <Text style={[styles.sliderValue, { color: colors.accent }]}>{settings.reader.lineHeight.toFixed(1)}</Text>
        </View>
        <NativeSlider
          minimumValue={1.5}
          maximumValue={3.0}
          step={0.1}
          value={settings.reader.lineHeight}
          onValueChange={(v) => updateReaderSettings({ lineHeight: Math.round(v * 10) / 10 })}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabelText, { color: colors.textMuted }]}>狭い</Text>
          <Text style={[styles.sliderLabelText, { color: colors.textMuted }]}>広い</Text>
        </View>
      </View>

      {/* Letter Spacing */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.sliderHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>字間</Text>
          <Text style={[styles.sliderValue, { color: colors.accent }]}>{settings.reader.letterSpacing.toFixed(2)}em</Text>
        </View>
        <NativeSlider
          minimumValue={0}
          maximumValue={0.15}
          step={0.01}
          value={settings.reader.letterSpacing}
          onValueChange={(v) => updateReaderSettings({ letterSpacing: Math.round(v * 100) / 100 })}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabelText, { color: colors.textMuted }]}>なし</Text>
          <Text style={[styles.sliderLabelText, { color: colors.textMuted }]}>広い</Text>
        </View>
      </View>

      {/* Preview */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>プレビュー</Text>
        {settings.reader.layout === "vertical" ? (
          <View style={[styles.previewBox, { height: 200, borderColor: colors.border, backgroundColor: colors.background }]}>
            <WebView
              key={`preview-${settings.theme}-${settings.reader.fontFamily}-${settings.reader.fontSize}-${settings.reader.lineHeight}-${settings.reader.letterSpacing}`}
              originWhitelist={["*"]}
              source={{ html: `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:${colors.background};height:100%;overflow:hidden}.v{writing-mode:vertical-rl;-webkit-writing-mode:vertical-rl;text-orientation:mixed;height:100%;overflow-x:auto;overflow-y:hidden;padding:12px;font-family:${FONT_FAMILY_OPTIONS[settings.reader.fontFamily].css};font-size:${FONT_SIZE_OPTIONS[settings.reader.fontSize].px}px;line-height:${settings.reader.lineHeight};letter-spacing:${settings.reader.letterSpacing}em;color:${colors.text}}p{margin-left:0.5em}</style></head><body><div class="v"><p>吾輩は猫である。名前はまだ無い。</p><p>どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。</p></div></body></html>` }}
              style={{ flex: 1, backgroundColor: colors.background }}
              scrollEnabled={false}
              javaScriptEnabled={false}
            />
          </View>
        ) : (
          <View style={[styles.previewBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={{
              fontSize: FONT_SIZE_OPTIONS[settings.reader.fontSize].px,
              lineHeight: FONT_SIZE_OPTIONS[settings.reader.fontSize].px * settings.reader.lineHeight,
              letterSpacing: settings.reader.letterSpacing * FONT_SIZE_OPTIONS[settings.reader.fontSize].px,
              color: colors.text,
            }}>
              　吾輩は猫である。名前はまだ無い。{"\n"}　どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F8" },
  content: { padding: 12, paddingBottom: 32 },
  pageTitle: { fontSize: 24, fontWeight: "700", color: "#111113", marginBottom: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1 },
  sectionTitle: { fontSize: 10, fontWeight: "700", color: "#111113", letterSpacing: 1, marginBottom: 6 },
  sectionDesc: { fontSize: 9, color: "#8E8E93", marginBottom: 8, marginTop: -2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#F0F0F5", borderWidth: 1, borderColor: "transparent" },
  chipActive: { backgroundColor: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.2)" },
  chipText: { fontSize: 11, fontWeight: "600", color: "#5A5A5E" },
  chipTextActive: { color: "#6366F1" },
  sliderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  sliderValue: { fontSize: 11, fontWeight: "600", color: "#6366F1" },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  sliderLabelText: { fontSize: 8, color: "#8E8E93" },
  previewBox: { backgroundColor: "#FAFAFA", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#E5E5EA", minHeight: 180 },
});
