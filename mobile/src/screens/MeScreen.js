import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { S } from '../store';

export default function MeScreen() {
  const [profile, setProfile] = useState({ name: 'Suyu', age: 0, weight: 0, height: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState({ name: '', age: '', weight: '', height: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    const saved = S.get('profile') || { name: 'Suyu', age: 25, weight: 70, height: 175 };
    setProfile(saved);
    setTempProfile({
      name: saved.name,
      age: saved.age.toString(),
      weight: saved.weight.toString(),
      height: saved.height.toString()
    });
  };

  const saveProfile = () => {
    const newProfile = {
      name: tempProfile.name || 'Suyu',
      age: parseFloat(tempProfile.age) || 0,
      weight: parseFloat(tempProfile.weight) || 0,
      height: parseFloat(tempProfile.height) || 0
    };
    S.set('profile', newProfile);
    setProfile(newProfile);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated!');
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all logs, workouts, and reset your profile. Continue?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            S.clear();
            loadProfile();
            Alert.alert('Done', 'All data cleared');
          }
        }
      ]
    );
  };

  const getStats = () => {
    const logs = S.get('logs') || {};
    const workouts = S.get('workouts') || {};
    const totalDays = Object.keys(logs).length;
    const totalWorkouts = Object.keys(workouts).reduce((acc, date) => acc + workouts[date].length, 0);
    return { totalDays, totalWorkouts };
  };

  const stats = getStats();
  const bmi = profile.height > 0 ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👤 Me</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
          <Ionicons name={isEditing ? 'close' : 'create'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <ScrollView style={styles.editForm}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={tempProfile.name}
              onChangeText={(text) => setTempProfile({ ...tempProfile, name: text })}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Age (years)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempProfile.age}
              onChangeText={(text) => setTempProfile({ ...tempProfile, age: text })}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempProfile.weight}
              onChangeText={(text) => setTempProfile({ ...tempProfile, weight: text })}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempProfile.height}
              onChangeText={(text) => setTempProfile({ ...tempProfile, height: text })}
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={styles.profileView}>
          <View style={styles.profileCard}>
            <Text style={styles.nameText}>{profile.name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.age}</Text>
                <Text style={styles.statLabel}>years</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.weight}</Text>
                <Text style={styles.statLabel}>kg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.height}</Text>
                <Text style={styles.statLabel}>cm</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{bmi}</Text>
                <Text style={styles.statLabel}>BMI</Text>
              </View>
            </View>
          </View>

          <View style={styles.activityCard}>
            <Text style={styles.cardTitle}>Activity Stats</Text>
            <View style={styles.activityRow}>
              <Ionicons name="calendar" size={20} color="#3b82f6" />
              <Text style={styles.activityText}>{stats.totalDays} days logged</Text>
            </View>
            <View style={styles.activityRow}>
              <Ionicons name="barbell" size={20} color="#10b981" />
              <Text style={styles.activityText}>{stats.totalWorkouts} workouts completed</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.dangerBtn} onPress={clearAllData}>
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.dangerBtnText}>Clear All Data</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>SuyuFit v1.0</Text>
            <Text style={styles.footerSubtext}>Built for Suyu 💪</Text>
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
  profileView: { flex: 1, padding: 16 },
  profileCard: { backgroundColor: '#1e293b', padding: 24, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  nameText: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  activityCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 12, marginBottom: 16 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  activityText: { color: '#94a3b8', fontSize: 16, marginLeft: 12 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', padding: 16, borderRadius: 8, marginBottom: 24 },
  dangerBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { color: '#64748b', fontSize: 14 },
  footerSubtext: { color: '#475569', fontSize: 12, marginTop: 4 }
});
