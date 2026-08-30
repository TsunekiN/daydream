/**
 * TTS インラインプレイヤー（リーダーヘッダー右）
 */

import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { speechEngine, type SpeechStatus } from "../lib/speech";

const RATE_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

interface Props {
  bodyHtml: string;
  isDark: boolean;
  accentColor: string;
  textSub: string;
}

export default function InlinePlayer({ bodyHtml, isDark, accentColor, textSub }: Props) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [rate, setRate] = useState(1.0);

  useEffect(() => {
    const unsub = speechEngine.subscribe((state) => { setStatus(state.status); });
    return unsub;
  }, []);

  useEffect(() => { return () => { speechEngine.stop(); }; }, []);

  const handlePlayPause = () => {
    if (status === "idle") speechEngine.speak(bodyHtml);
    else if (status === "playing") speechEngine.pause();
    else if (status === "paused") speechEngine.resume();
  };

  const cycleRate = () => {
    const idx = RATE_OPTIONS.indexOf(rate);
    const next = RATE_OPTIONS[(idx + 1) % RATE_OPTIONS.length];
    setRate(next);
    speechEngine.setRate(next);
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <TouchableOpacity onPress={handlePlayPause} style={{ padding: 6 }}>
        <Text style={{ fontSize: 14, color: status === "playing" ? accentColor : textSub }}>
          {status === "playing" ? "⏸" : "▶"}
        </Text>
      </TouchableOpacity>
      {status !== "idle" && (
        <TouchableOpacity onPress={() => speechEngine.stop()} style={{ padding: 6 }}>
          <Text style={{ fontSize: 12, color: textSub }}>■</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={cycleRate} style={{ backgroundColor: isDark ? "#3A3A3D" : "#E5E5EA", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}>
        <Text style={{ fontSize: 9, fontWeight: "600", color: textSub }}>{rate}x</Text>
      </TouchableOpacity>
    </View>
  );
}
