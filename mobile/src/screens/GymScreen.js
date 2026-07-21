import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { S } from '../store';

export default function GymScreen() {
  const [workouts, setWorkouts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState([]);
  const [newSet, setNewSet] = useState({ reps: '', weight: '' });

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = () => {
    const today = new Date().toISOString().split('T')[0];
    const allWorkouts = S.get('workouts') || {};
    setWorkouts(allWorkouts[today] || []);
  };

  const addExercise = () => {
    if (!exerciseName || sets.length === 0) {
      Alert.alert('Error', 'Name and at least one set required');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const allWorkouts = S.get('workouts') || {};
    if (!allWorkouts[today]) allWorkouts[today] = [];
    allWorkouts[today].push({
      name: exerciseName,
      sets: sets,
      time: new Date().toTimeString().slice(0, 5)
    });
    S.set('workouts', allWorkouts);
    setExerciseName('');
    setSets([]);
    setShowAdd(false);
    loadWorkouts();
  };

  const addSet = () => {
    if (!newSet.reps || !newSet.weight) {
      Alert.alert('Error', 'Reps and weight required');
      return;
    }
    setSets([...sets, { reps: parseInt(newSet.reps), weight: parseFloat(newSet.weight) }]);
    setNewSet({ reps: '', weight: '' });
  };

  const removeSet = (index) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const deleteWorkout = (index) => {
    Alert.alert('Delete', 'Remove this workout?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => {
          const today = new Date().toISOString().split('T')[0];
          const allWorkouts = S.get('workouts') || {};
          allWorkouts[today].splice(index, 1);
          S.set('workouts', allWorkouts);
          loadWorkouts();
        }
      }
    ]);
  };

  const totalVolume = workouts.reduce((acc, w) => {
    const vol = w.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
    return acc + vol;
  }, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💪 Gym</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statLabel}>Total Volume</Text>
        <Text style={styles.statValue}>{totalVolume.toFixed(1)} kg</Text>
        <Text style={styles.statLabel}>{workouts.length} exercises</Text>
      </View>

      <ScrollView style={styles.workoutList}>
        {workouts.map((workout, i) => (
          <View key={i} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View>
                <Text style={styles.workoutTime}>{workout.time}</Text>
                <Text style={styles.workoutName}>{workout.name}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteWorkout(i)}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
            <View style={styles.setsContainer}>
              {workout.sets.map((set, j) => (
                <View key={j} style={styles.setRow}>
                  <Text style={styles.setLabel}>Set {j + 1}</Text>
                  <Text style={styles.setData}>{set.reps} reps × {set.weight} kg</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); setExerciseName(''); setSets([]); }}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Exercise name"
              placeholderTextColor="#64748b"
              value={exerciseName}
              onChangeText={setExerciseName}
            />

            <Text style={styles.sectionTitle}>Sets</Text>
            {sets.map((set, i) => (
              <View key={i} style={styles.setItem}>
                <Text style={styles.setText}>Set {i + 1}: {set.reps} reps × {set.weight} kg</Text>
                <TouchableOpacity onPress={() => removeSet(i)}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.setInputRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Reps"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={newSet.reps}
                onChangeText={(text) => setNewSet({ ...newSet, reps: text })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Weight (kg)"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={newSet.weight}
                onChangeText={(text) => setNewSet({ ...newSet, weight: text })}
              />
            </View>
            <TouchableOpacity style={styles.setAddBtn} onPress={addSet}>
              <Text style={styles.setBtnText}>Add Set</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={addExercise}>
              <Text style={styles.submitBtnText}>Save Exercise</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1e293b' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  addBtn: { padding: 8 },
  stats: { alignItems: 'center', padding: 20, backgroundColor: '#1e293b', marginBottom: 8 },
  statLabel: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  statValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 8 },
  workoutList: { flex: 1, padding: 16 },
  workoutCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 8, marginBottom: 12 },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  workoutTime: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  workoutName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  setsContainer: { gap: 6 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  setLabel: { color: '#94a3b8', fontSize: 14 },
  setData: { color: '#fff', fontSize: 14 },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1e293b' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  form: { padding: 16 },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 8, marginBottom: 12 },
  setItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#334155', padding: 12, borderRadius: 6, marginBottom: 8 },
  setText: { color: '#fff', fontSize: 14 },
  setInputRow: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  setAddBtn: { backgroundColor: '#64748b', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  setBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  submitBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
