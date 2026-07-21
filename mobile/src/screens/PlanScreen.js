import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { S } from '../store';

export default function PlanScreen() {
  const [plan, setPlan] = useState({ carbs: 0, protein: 0, fat: 0, fiber: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [tempPlan, setTempPlan] = useState({ carbs: '', protein: '', fat: '', fiber: '' });

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = () => {
    const saved = S.get('plan') || { carbs: 200, protein: 150, fat: 60, fiber: 30 };
    setPlan(saved);
    setTempPlan({
      carbs: saved.carbs.toString(),
      protein: saved.protein.toString(),
      fat: saved.fat.toString(),
      fiber: saved.fiber.toString()
    });
  };

  const savePlan = () => {
    const newPlan = {
      carbs: parseFloat(tempPlan.carbs) || 0,
      protein: parseFloat(tempPlan.protein) || 0,
      fat: parseFloat(tempPlan.fat) || 0,
      fiber: parseFloat(tempPlan.fiber) || 0
    };
    S.set('plan', newPlan);
    setPlan(newPlan);
    setIsEditing(false);
    Alert.alert('Success', 'Plan updated!');
  };

  const getTodayProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    const logs = S.get('logs') || {};
    const todayLogs = logs[today] || [];
    return todayLogs.reduce((acc, log) => ({
      carbs: acc.carbs + (log.carbs || 0),
      protein: acc.protein + (log.protein || 0),
      fat: acc.fat + (log.fat || 0),
      fiber: acc.fiber + (log.fiber || 0)
    }), { carbs: 0, protein: 0, fat: 0, fiber: 0 });
  };

  const progress = getTodayProgress();
  const percentages = {
    carbs: plan.carbs > 0 ? (progress.carbs / plan.carbs) * 100 : 0,
    protein: plan.protein > 0 ? (progress.protein / plan.protein) * 100 : 0,
    fat: plan.fat > 0 ? (progress.fat / plan.fat) * 100 : 0,
    fiber: plan.fiber > 0 ? (progress.fiber / plan.fiber) * 100 : 0
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Plan</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
          <Ionicons name={isEditing ? 'close' : 'create'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <ScrollView style={styles.editForm}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Daily Carbs Target (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempPlan.carbs}
              onChangeText={(text) => setTempPlan({ ...tempPlan, carbs: text })}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Daily Protein Target (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempPlan.protein}
              onChangeText={(text) => setTempPlan({ ...tempPlan, protein: text })}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Daily Fat Target (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempPlan.fat}
              onChangeText={(text) => setTempPlan({ ...tempPlan, fat: text })}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Daily Fiber Target (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempPlan.fiber}
              onChangeText={(text) => setTempPlan({ ...tempPlan, fiber: text })}
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={savePlan}>
            <Text style={styles.saveBtnText}>Save Plan</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={styles.progressView}>
          <View style={styles.progressCard}>
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>🍞 Carbs</Text>
              <Text style={styles.macroValue}>
                {progress.carbs.toFixed(1)}g / {plan.carbs}g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(percentages.carbs, 100)}%`, backgroundColor: '#3b82f6' }]} />
            </View>
            <Text style={styles.percentText}>{percentages.carbs.toFixed(0)}%</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>🍗 Protein</Text>
              <Text style={styles.macroValue}>
                {progress.protein.toFixed(1)}g / {plan.protein}g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(percentages.protein, 100)}%`, backgroundColor: '#10b981' }]} />
            </View>
            <Text style={styles.percentText}>{percentages.protein.toFixed(0)}%</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>🥑 Fat</Text>
              <Text style={styles.macroValue}>
                {progress.fat.toFixed(1)}g / {plan.fat}g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(percentages.fat, 100)}%`, backgroundColor: '#f59e0b' }]} />
            </View>
            <Text style={styles.percentText}>{percentages.fat.toFixed(0)}%</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>🌾 Fiber</Text>
              <Text style={styles.macroValue}>
                {progress.fiber.toFixed(1)}g / {plan.fiber}g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(percentages.fiber, 100)}%`, backgroundColor: '#8b5cf6' }]} />
            </View>
            <Text style={styles.percentText}>{percentages.fiber.toFixed(0)}%</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1e293b' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  editBtn: { padding: 8 },
  editForm: { flex: 1, padding: 16 },
  formGroup: { marginBottom: 20 },
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16 },
  saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  progressView: { flex: 1, padding: 16 },
  progressCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 8, marginBottom: 16 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  macroLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  macroValue: { color: '#94a3b8', fontSize: 16 },
  progressBar: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  percentText: { color: '#64748b', fontSize: 12, textAlign: 'right' }
});
