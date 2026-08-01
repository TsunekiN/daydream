import { useState, useRef } from "react";
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from "react-native";

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (value: number) => void;
}

export default function Slider({ min, max, value, onValueChange }: SliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const fraction = max > min ? (value - min) / (max - min) : 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        updateValue(x);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        updateValue(x);
      },
    })
  ).current;

  const updateValue = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return;
    const ratio = Math.max(0, Math.min(1, x / w));
    const newVal = Math.round(min + ratio * (max - min));
    onValueChange(newVal);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    widthRef.current = w;
  };

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: `${fraction * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 32, justifyContent: "center", position: "relative" },
  track: { height: 4, backgroundColor: "#E5E5EA", borderRadius: 2, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 2 },
  thumb: {
    position: "absolute", top: 10, width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#6366F1", marginLeft: -8,
    shadowColor: "#6366F1", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
});
