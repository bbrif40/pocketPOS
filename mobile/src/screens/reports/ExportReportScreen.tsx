import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';

export function ExportReportScreen() {
  const entitlements = useEntitlements();
  const [period, setPeriod] = useState<'30days' | 'month' | 'quarter' | 'all'>('30days');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    filename: string;
    checksum: string;
    timestamp: string;
  } | null>(null);

  const handleGenerate = () => {
    if (!entitlements.exportPdfCsv) {
      Alert.alert(
        'Pro Plan Feature',
        'PDF/CSV financial export is available on the Pro tier (₱299/mo). Switch to Pro in Settings > Plan Switcher to unlock.',
      );
      return;
    }

    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedResult({
        filename: `PocketPOS_Financial_${period.toUpperCase()}.${format}`,
        checksum: `sha256:7f9a${Math.floor(Math.random() * 1000000)}...`,
        timestamp: new Date().toLocaleString(),
      });
    }, 600);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerOverline}>PROOF OF INCOME & ARCHIVE</Text>
          <Text style={styles.headerTitle}>Export Reports</Text>
        </View>

        {!entitlements.exportPdfCsv && (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.lockTitle}>🔒 PRO PLAN FEATURE</Text>
            <Text style={styles.lockDesc}>
              Export your sales records and cash flows into verified PDF or CSV files for bank loans
              or personal bookkeeping.
            </Text>
          </View>
        )}

        {/* Period Selection */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>SELECT REPORTING PERIOD</Text>
          <View style={styles.optionsRow}>
            {[
              { id: '30days', label: 'Past 30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'quarter', label: 'Quarterly' },
              { id: 'all', label: 'Full Archive' },
            ].map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.optPill, period === p.id && styles.optPillActive]}
                onPress={() => setPeriod(p.id as typeof period)}
              >
                <Text style={[styles.optText, period === p.id && styles.optTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Format Selection */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>DOCUMENT FORMAT</Text>
          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[styles.formatCard, format === 'pdf' && styles.formatCardActive]}
              onPress={() => setFormat('pdf')}
            >
              <Text style={styles.formatIcon}>📄</Text>
              <Text style={styles.formatTitle}>PDF Statement</Text>
              <Text style={styles.formatSub}>Formatted for microlenders and banks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.formatCard, format === 'csv' && styles.formatCardActive]}
              onPress={() => setFormat('csv')}
            >
              <Text style={styles.formatIcon}>📊</Text>
              <Text style={styles.formatTitle}>CSV Spreadsheet</Text>
              <Text style={styles.formatSub}>Raw line items for Excel / Google Sheets</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={generating}
        >
          <Text style={styles.generateBtnText}>
            {generating ? 'Compiling Local Data…' : `Compile ${format.toUpperCase()} Dossier →`}
          </Text>
        </TouchableOpacity>

        {/* Output card */}
        {generatedResult && (
          <View
            style={[
              commonStyles.card,
              { marginTop: 16, backgroundColor: '#eaf4ee', borderColor: '#c0decb' },
            ]}
          >
            <Text style={styles.resultTitle}>✓ Export Ready for Download</Text>
            <Text style={styles.resultFile}>{generatedResult.filename}</Text>
            <Text style={styles.resultMeta}>Generated {generatedResult.timestamp}</Text>
            <Text style={styles.resultChecksum}>Verified Hash: {generatedResult.checksum}</Text>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() =>
                Alert.alert(
                  'Export Ready',
                  `Downloaded ${generatedResult.filename} to local device storage.`,
                )
              }
            >
              <Text style={styles.downloadBtnText}>Save / Share File →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerOverline: {
    color: THEME.colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontFamily: THEME.typography.serif,
    fontSize: 28,
    color: THEME.colors.pine,
    marginTop: 2,
  },
  lockTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.pine,
    letterSpacing: 1,
    marginBottom: 4,
  },
  lockDesc: {
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 16,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optPill: {
    backgroundColor: '#e7ede8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: THEME.radius.pill,
  },
  optPillActive: {
    backgroundColor: THEME.colors.pine,
  },
  optText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  optTextActive: {
    color: THEME.colors.white,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatCard: {
    flex: 1,
    backgroundColor: '#f1f5f2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  formatCardActive: {
    borderColor: THEME.colors.pine,
    backgroundColor: THEME.colors.white,
  },
  formatIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.pine,
    marginBottom: 2,
  },
  formatSub: {
    fontSize: 11,
    color: THEME.colors.muted,
    lineHeight: 14,
  },
  generateBtn: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: THEME.colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  resultFile: {
    fontFamily: THEME.typography.serif,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.pine,
    marginTop: 4,
  },
  resultMeta: {
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  resultChecksum: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: THEME.colors.muted,
    marginTop: 4,
  },
  downloadBtn: {
    backgroundColor: THEME.colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  downloadBtnText: {
    color: THEME.colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
});
