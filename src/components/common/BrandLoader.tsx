import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../styles/theme';

export interface BrandLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP = {
  sm: 40,
  md: 68,
  lg: 108,
  xl: 148,
};

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  size = 'md',
  message,
  fullScreen = false,
  style,
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md;

  // Animation values
  const hostScale = useSharedValue(1);
  const companionScale = useSharedValue(1);
  const companionNudge = useSharedValue(0);
  const chordOpacity = useSharedValue(0.7);
  const containerRotation = useSharedValue(0);

  useEffect(() => {
    // 1. Host circle gentle rhythmic pulse (heartbeat of the plan)
    hostScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 2. Companion circle follows in cadence (stepping into the tangent)
    companionScale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 850, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // 3. Companion subtle step towards the host
    companionNudge.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 850, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 850, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // 4. Connecting chord line energy breath
    chordOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 5. Very subtle organic tilt of the whole system
    containerRotation.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [chordOpacity, companionNudge, companionScale, containerRotation, hostScale]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${containerRotation.value}deg` }],
  }));

  const hostAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hostScale.value }],
  }));

  const companionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: companionScale.value },
      { translateX: companionNudge.value },
      { translateY: companionNudge.value * 0.7 },
    ],
  }));

  const chordAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chordOpacity.value,
  }));

  const content = (
    <View style={[styles.centerContainer, style]}>
      <Animated.View
        style={[
          { width: pixelSize, height: pixelSize },
          styles.svgWrapper,
          containerAnimatedStyle,
        ]}
      >
        {/* Host Circle: Sunset Coral with rhythmic breathing scale */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: pixelSize * (250 / 1024),
              top: pixelSize * (290 / 1024),
              width: pixelSize * (340 / 1024),
              height: pixelSize * (340 / 1024),
              borderRadius: (pixelSize * (340 / 1024)) / 2,
              backgroundColor: theme.colors.primary,
            },
            hostAnimatedStyle,
          ]}
        />

        {/* Companion Circle: Midnight Charcoal with cadence nudge & scale */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: pixelSize * (530 / 1024),
              top: pixelSize * (510 / 1024),
              width: pixelSize * (200 / 1024),
              height: pixelSize * (200 / 1024),
              borderRadius: (pixelSize * (200 / 1024)) / 2,
              backgroundColor: theme.colors.foreground,
            },
            companionAnimatedStyle,
          ]}
        />

        {/* Connecting Tangent Bridge Chord: Warm Linen with breathing opacity */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            chordAnimatedStyle,
          ]}
        >
          <Svg
            width={pixelSize}
            height={pixelSize}
            viewBox="0 0 1024 1024"
          >
            <Line
              x1="420"
              y1="460"
              x2="630"
              y2="610"
              stroke="#FAF8F5"
              strokeWidth="28"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      </Animated.View>

      {Boolean(message) && (
        <Text style={[styles.messageText, pixelSize <= 50 && styles.smallMessageText]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreenWrapper}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  messageText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  smallMessageText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.xs,
  },
});

export default BrandLoader;
