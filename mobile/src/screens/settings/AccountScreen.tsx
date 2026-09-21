import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { THEME, commonStyles } from '../../theme/theme';
import { usePlan } from '../../entitlements/entitlements';

export function AccountScreen() {
  const plan = usePlan();
  const [storeName, setStoreName] = useState('Anya & Maya Sari-Sari Store');
  const [phone, setPhone] = useState('+63 917 555 0192');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('Store Profile Updated', 'Your vendor profile has been saved to local SQLite.');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Hero Card */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>REGISTERED VENDOR ACCOUNT</Text>
          <Text style={commonStyles.heroAmount}>{storeName}</Text>
          <Text style={commonStyles.heroSubtitle}>Owner: Anya Khanna · Currency: ₱ (PHP)</Text>
        </View>

        {/* Store Profile Details */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>BUSINESS INFORMATION</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Business Name</Text>
            {isEditing ? (
              <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} />
            ) : (
              <Text style={styles.fieldValue}>{storeName}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Contact (GCash verified)</Text>
            {isEditing ? (
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} />
            ) : (
              <Text style={styles.fieldValue}>{phone}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Operating Currency</Text>
            <Text style={styles.fieldValue}>₱ Philippine Peso (PHP)</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Active Subscription Tier</Text>
            <Text style={[styles.fieldValue, { color: THEME.colors.goldDark, fontWeight: '700' }]}>
              {plan.toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.editButton, isEditing && styles.saveButton]}
            onPress={isEditing ? handleSave : () => setIsEditing(true)}
          >
            <Text style={[styles.editButtonText, isEditing && styles.saveButtonText]}>
              {isEditing ? 'Save Changes →' : 'Edit Information'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sync & Cloud Status */}
        <View style={commonStyles.dashedCard}>
          <Text style={styles.syncHeader}>LOCAL STORAGE & BACKUP STATUS</Text>
          <Text style={styles.syncText}>
            All records are safely stored on-device in SQLite. Cloud synchronization and automatic
            backups activate when paired with Basic+ tier.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  fieldGroup: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ed',
  },
  fieldLabel: {
    fontSize: 11,
    color: THEME.colors.muted,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  input: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: THEME.colors.pine,
  },
  editButton: {
    marginTop: 14,
    backgroundColor: '#e7ede8',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: THEME.colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: THEME.colors.pine,
  },
  saveButtonText: {
    color: THEME.colors.gold,
  },
  syncHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.pine,
    letterSpacing: 1,
    marginBottom: 4,
  },
  syncText: {
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 16,
  },
});
