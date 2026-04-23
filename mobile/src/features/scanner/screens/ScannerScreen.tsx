import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Camera, PenLine, RotateCcw, Search } from 'lucide-react-native';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import type { ScanStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ScanStackParamList, 'Scanner'>;

const SCAN_LINE_TRAVEL = 150; // ~frame height minus padding

function ScanLine({ color }: { color: string }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(SCAN_LINE_TRAVEL, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[scanLineStyles.line, { backgroundColor: color }, animStyle]} />
  );
}

const scanLineStyles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 4,
    height: 2,
    borderRadius: 1,
    opacity: 0.8,
  },
});

export function ScannerScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, []),
  );

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanned) return;
      setScanned(true);

      const isbn = result.data;
      if (/^(97[89])?\d{9}[\dX]$/i.test(isbn.replace(/-/g, ''))) {
        navigation.navigate('ScanResult', { isbn: isbn.replace(/-/g, '') });
      } else {
        setScanned(false);
      }
    },
    [scanned, navigation],
  );

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  if (!permission) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <Text style={[s.permissionText, { color: c.text.secondary }]}>
          {t('scanner.requestingPermission', 'Requesting camera permission...')}
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <View style={[s.permissionIcon, { backgroundColor: isDark ? c.auth.card : accent + '18' }]}>
          <Camera size={40} color={accent} />
        </View>
        <Text style={[s.permissionTitle, { color: c.text.primary }]}>
          {t('scanner.cameraRequired', 'Camera Access Required')}
        </Text>
        <Text style={[s.permissionText, { color: c.text.secondary }]}>
          {t('scanner.cameraExplain', 'We need camera access to scan book barcodes and look them up instantly.')}
        </Text>
        <Pressable
          style={({ pressed }) => [s.grantBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel={t('scanner.accessibility.grantPermission', 'Grant camera permission')}
        >
          <Text style={s.grantBtnText}>
            {t('scanner.grantPermission', 'Grant Permission')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: isDark ? c.auth.bgDeep : '#000' }]}>
      {isFocused ? (
      <CameraView
        style={s.camera}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={[s.overlay, { backgroundColor: isDark ? 'rgba(10, 18, 14, 0.6)' : 'rgba(0,0,0,0.45)' }]}>
          {/* Top hint */}
          <Text style={[s.hintTop, { color: isDark ? c.auth.cream : '#fff' }]}>
            {t('scanner.hint', 'Align the barcode within the frame')}
          </Text>

          {/* Scan frame */}
          <View style={[s.scanFrame, { borderColor: accent }]}>
            <View style={[s.cornerTL, { borderColor: accent }]} />
            <View style={[s.cornerTR, { borderColor: accent }]} />
            <View style={[s.cornerBL, { borderColor: accent }]} />
            <View style={[s.cornerBR, { borderColor: accent }]} />
            {!scanned && <ScanLine color={accent} />}
          </View>

          <Text style={[s.hintSub, { color: isDark ? c.auth.textMuted : 'rgba(255,255,255,0.6)' }]}>
            {t('scanner.isbnHint', 'ISBN barcodes are usually on the back cover')}
          </Text>
        </View>
      </CameraView>
      ) : (
        <View style={s.camera} />
      )}

      {/* Bottom actions */}
      <View style={s.actionsWrap}>
        {scanned ? (
          <Pressable
            style={({ pressed }) => [s.actionBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => setScanned(false)}
            accessibilityRole="button"
            accessibilityLabel={t('scanner.accessibility.scanAgain', 'Scan again')}
          >
            <RotateCcw size={18} color="#fff" />
            <Text style={s.actionBtnText}>{t('common.retry', 'Scan Again')}</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            s.manualBtn,
            { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => navigation.navigate('BookSearch')}
          accessibilityRole="button"
          accessibilityLabel={t('scanner.accessibility.searchByTitle', 'Search by title')}
        >
          <Search size={18} color={accent} />
          <Text style={[s.manualBtnText, { color: c.text.primary }]}>
            {t('scanner.searchByTitle', 'Search by title')}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            s.manualBtn,
            { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => navigation.navigate('AddBook', {})}
          accessibilityRole="button"
          accessibilityLabel={t('scanner.accessibility.addManually', 'Add book manually')}
        >
          <PenLine size={18} color={accent} />
          <Text style={[s.manualBtnText, { color: c.text.primary }]}>
            {t('scanner.addManually', 'Add manually')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const s = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },

  // Permission states
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  grantBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
  },
  grantBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Camera overlay
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  hintTop: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scanFrame: {
    width: 280,
    height: 160,
    borderRadius: 4,
    position: 'relative',
  },
  hintSub: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Corner accents
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 8,
  },

  // Bottom actions
  actionsWrap: {
    position: 'absolute',
    bottom: 120,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radius.xl,
    width: '100%',
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    width: '100%',
  },
  manualBtnText: { fontWeight: '600', fontSize: 14 },
});
