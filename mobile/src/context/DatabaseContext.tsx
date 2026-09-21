/**
 * DatabaseContext — provides the open SQLite DB instance to the entire app.
 * Opens the database once on mount, runs migrations, then renders children.
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabase } from '../db/database';

interface DatabaseContextValue {
  db: SQLiteDatabase;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openDatabase()
      .then(setDb)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      });
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Database error: {error}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={{ db }}>{children}</DatabaseContext.Provider>;
}

/** Hook — use inside any screen that needs direct DB access. */
export function useDatabase(): SQLiteDatabase {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase() must be used inside <DatabaseProvider>');
  }
  return ctx.db;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  errorText: { color: '#DC2626', fontSize: 14, paddingHorizontal: 24, textAlign: 'center' },
});
