import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../../styles/theme';

export function ShimmerBlock({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.colors.muted,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function PlanCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.headerSkeleton}>
        <View style={styles.hostRow}>
          <ShimmerBlock width={38} height={38} borderRadius={19} />
          <View style={{ gap: 6 }}>
            <ShimmerBlock width={120} height={14} borderRadius={4} />
            <ShimmerBlock width={60} height={10} borderRadius={4} />
          </View>
        </View>
        <ShimmerBlock width={70} height={22} borderRadius={11} />
      </View>

      <View style={{ gap: 10, marginVertical: 14 }}>
        <ShimmerBlock width="85%" height={20} borderRadius={6} />
        <ShimmerBlock width="60%" height={14} borderRadius={4} />
        <ShimmerBlock width="45%" height={14} borderRadius={4} />
      </View>

      <View style={styles.footerSkeleton}>
        <ShimmerBlock width={80} height={24} borderRadius={12} />
        <ShimmerBlock width={90} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function HotspotCardSkeleton() {
  return (
    <View style={styles.hotspotSkeleton}>
      <ShimmerBlock width={200} height={120} borderRadius={theme.borderRadius.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 46, 0.05)',
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 27, 46, 0.05)',
    paddingTop: 12,
  },
  hotspotSkeleton: {
    width: 200,
    height: 120,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
  },
});
