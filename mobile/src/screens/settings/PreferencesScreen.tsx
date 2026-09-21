import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { THEME, commonStyles } from '../../theme/theme';
import { useEntitlements } from '../../entitlements/entitlements';

const PREFS_STORAGE_KEY = '@pocketpos/preferences';

export function PreferencesScreen() {
  const navigation = useNavigation();
  const entitlements = useEntitlements();

  // Preferences state
  const [language, setLanguage] = useState<'en' | 'fil'>('en');
  const [showDecimals, setShowDecimals] = useState(true);
  const [soundFeedback, setSoundFeedback] = useState(true);
  const [autoShowReceipt, setAutoShowReceipt] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [autoPrintBluetooth, setAutoPrintBluetooth] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.language) setLanguage(parsed.language);
          if (parsed.showDecimals !== undefined) setShowDecimals(parsed.showDecimals);
          if (parsed.soundFeedback !== undefined) setSoundFeedback(parsed.soundFeedback);
          if (parsed.autoShowReceipt !== undefined) setAutoShowReceipt(parsed.autoShowReceipt);
          if (parsed.highContrastMode !== undefined) setHighContrastMode(parsed.highContrastMode);
          if (parsed.autoPrintBluetooth !== undefined)
            setAutoPrintBluetooth(parsed.autoPrintBluetooth);
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const handleSave = async () => {
    const prefs = {
      language,
      showDecimals,
      soundFeedback,
      autoShowReceipt,
      highContrastMode,
      autoPrintBluetooth,
    };
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    Alert.alert('Preferences Saved', 'Your POS preferences have been updated successfully.');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Settings</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>POS Preferences</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Hero Card */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>CASHIER & REGISTER SETTINGS</Text>
          <Text style={commonStyles.heroAmount}>Preferences</Text>
          <Text style={commonStyles.heroSubtitle}>
            Configure language, sound feedback, receipts, and screen contrast for outdoor market
            stalls.
          </Text>
        </View>

        {/* Language Selection */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>INTERFACE LANGUAGE / WIKA</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, language === 'fil' && styles.langBtnActive]}
              onPress={() => setLanguage('fil')}
            >
              <Text style={[styles.langBtnText, language === 'fil' && styles.langBtnTextActive]}>
                Filipino / Tagalog
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register & Calculator Shortcuts */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>CASH REGISTER SHORTCUTS</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Show Centavos / Decimals</Text>
              <Text style={styles.switchDesc}>Format prices as ₱65.00 instead of ₱65</Text>
            </View>
            <Switch
              value={showDecimals}
              onValueChange={setShowDecimals}
              trackColor={{ false: '#dce8df', true: THEME.colors.pine }}
              thumbColor={showDecimals ? THEME.colors.gold : '#f4f3ee'}
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Audio & Tap Feedback</Text>
              <Text style={styles.switchDesc}>Play chime on successful sale confirmation</Text>
            </View>
            <Switch
              value={soundFeedback}
              onValueChange={setSoundFeedback}
              trackColor={{ false: '#dce8df', true: THEME.colors.pine }}
              thumbColor={soundFeedback ? THEME.colors.gold : '#f4f3ee'}
            />
          </View>
        </View>

        {/* Receipts & Printing */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>RECEIPTS & INVOICING</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Auto-Display Sale Receipt</Text>
              <Text style={styles.switchDesc}>
                Popup printable receipt modal immediately after checkout
              </Text>
            </View>
            <Switch
              value={autoShowReceipt}
              onValueChange={setAutoShowReceipt}
              trackColor={{ false: '#dce8df', true: THEME.colors.pine }}
              thumbColor={autoShowReceipt ? THEME.colors.gold : '#f4f3ee'}
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>
                Auto-Print via Bluetooth {!entitlements.bluetoothPrinting && '🔒'}
              </Text>
              <Text style={styles.switchDesc}>
                Direct connection to ESC/POS 58mm/80mm thermal mobile printers (Basic+ tier)
              </Text>
            </View>
            <Switch
              value={autoPrintBluetooth}
              disabled={!entitlements.bluetoothPrinting}
              onValueChange={setAutoPrintBluetooth}
              trackColor={{ false: '#dce8df', true: THEME.colors.pine }}
              thumbColor={autoPrintBluetooth ? THEME.colors.gold : '#f4f3ee'}
            />
          </View>
        </View>

        {/* Outdoor Market High-Contrast Mode */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>ACCESSIBILITY & SUNLIGHT</Text>

          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>High-Contrast Sunlight Mode</Text>
              <Text style={styles.switchDesc}>
                Boosts text contrast and borders for outdoor stalls under bright sunlight
              </Text>
            </View>
            <Switch
              value={highContrastMode}
              onValueChange={setHighContrastMode}
              trackColor={{ false: '#dce8df', true: THEME.colors.pine }}
              thumbColor={highContrastMode ? THEME.colors.gold : '#f4f3ee'}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Preferences →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: THEME.colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  backBtnText: {
    color: THEME.colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    fontFamily: THEME.typography.serif,
    fontSize: 22,
    color: THEME.colors.pine,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    backgroundColor: '#e7ede8',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langBtnActive: {
    backgroundColor: THEME.colors.pine,
    borderColor: THEME.colors.pine,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  langBtnTextActive: {
    color: THEME.colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ed',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  switchDesc: {
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 2,
    lineHeight: 15,
  },
  saveBtn: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: THEME.colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
});
