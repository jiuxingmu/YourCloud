import { Feather } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { AppTheme } from './theme';

type ToastType = 'success' | 'error' | 'info';

type Props = {
  message: string;
  type?: ToastType;
  onHidden?: () => void;
};

export function ToastMessage({ message, type = 'info', onHidden }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(8);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHidden?.();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, onHidden, opacity, translateY]);

  const palette = {
    success: { bg: '#E8F8EE', border: '#BBE7CA', text: '#166534', icon: 'check-circle' as const },
    error: { bg: '#FDECEC', border: '#F7C5C5', text: '#991B1B', icon: 'alert-circle' as const },
    info: { bg: '#EAF2FF', border: '#C8DDFD', text: '#1E3A8A', icon: 'info' as const },
  }[type];

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
        <Feather name={palette.icon} size={16} color={palette.text} />
        <Text style={[styles.text, { color: palette.text }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 28,
    zIndex: 30,
  },
  card: {
    borderRadius: AppTheme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
