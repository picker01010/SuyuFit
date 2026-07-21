import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { S } from '../store';
import { foods } from '../foods';

const BACKEND_URL = 'https://suyufit-backend.onrender.com';

export default function FoodScreen() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualData, setManualData] = useState({ name: '', carbs: '', protein: '', fat: '', fiber: '' });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const today = new Date().toISOString().split('T')[0];
    const allLogs = S.get('logs') || {};
    setLogs(allLogs[today] || []);
  };

  const addLog = (item) => {
    const today = new Date().toISOString().split('T')[0];
    const allLogs = S.get('logs') || {};
    if (!allLogs[today]) allLogs[today] = [];
    allLogs[today].push({ ...item, time: new Date().toTimeString().slice(0, 5) });
    S.set('logs', allLogs);
    loadLogs();
  };

  const deleteLog = (index) => {
    Alert.alert('Delete', 'Remove this entry?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => {
          const today = new Date().toISOString().split('T')[0];
          const allLogs = S.get('logs') || {};
          allLogs[today].splice(index, 1);
          S.set('logs', allLogs);
          loadLogs();
        }
      }
    ]);
  };

  const handleBarcodeScan = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: result.assets[0].base64 })
        });
        const data = await response.json();
        if (data.success) {
          addLog({
            name: data.name || 'Scanned Item',
            carbs: data.carbs || 0,
            protein: data.protein || 0,
            fat: data.fat || 0,
            fiber: data.fiber || 0
          });
          Alert.alert('Success', 'Food logged from scan!');
        } else {
          Alert.alert('Error', data.error || 'Scan failed');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to process scan');
      }
    }
  };

  const handleManualAdd = () => {
    if (!manualData.name || !manualData.carbs) {
      Alert.alert('Error', 'Name and carbs required');
      return;
    }
    addLog({
      name: manualData.name,
      carbs: parseFloat(manualData.carbs) || 0,
      protein: parseFloat(manualData.protein) || 0,
      fat: parseFloat(manualData.fat) || 0,
      fiber: parseFloat(manualData.fiber) || 0
    });
    setManualData({ name: '', carbs: '', protein: '', fat: '', fiber: '' });
    setShowManual(false);
  };

  const filteredFoods = foods.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = logs.reduce((acc, log) => ({
    carbs: acc.carbs + (log.carbs || 0),
    protein: acc.protein + (log.protein || 0),
    fat: acc.fat + (log.fat || 0),
    fiber: acc.fiber + (log.fiber || 0)
  }), { carbs: 0, protein: 0, fat: 0, fiber: 0 });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍽️ Food</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleBarcodeScan} style={styles.iconBtn}>
            <Ionicons name="scan" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.iconBtn}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowManual(true)} style={styles.iconBtn}>
            <Ionicons name="add-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.totals}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Carbs</Text>
          <Text style={styles.totalValue}>{totals.carbs.toFixed(1)}g</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Protein</Text>
          <Text style={styles.totalValue}>{totals.protein.toFixed(1)}g</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Fat</Text>
          <Text style={styles.totalValue}>{totals.fat.toFixed(1)}g</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Fiber</Text>
          <Text style={styles.totalValue}>{totals.fiber.toFixed(1)}g</Text>
        </View>
      </View>

      <ScrollView style={styles.logsList}>
        {logs.map((log, i) => (
          <View key={i} style={styles.logItem}>
            <View style={styles.logLeft}>
              <Text style={styles.logTime}>{log.time}</Text>
              <Text style={styles.logName}>{log.name}</Text>
              <Text style={styles.logMacros}>
                C: {log.carbs}g • P: {log.protein}g • F: {log.fat}g • Fb: {log.fiber}g
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteLog(i)}>
              <Ionicons name="trash" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showSearch} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Foods</Text>
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <ScrollView style={styles.foodList}>
            {filteredFoods.map((food, i) => (
              <TouchableOpacity
                key={i}
                style={styles.foodItem}
                onPress={() => {
                  addLog(food);
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodMacros}>
                  C: {food.carbs}g • P: {food.protein}g • F: {food.fat}g • Fb: {food.fiber}g
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showManual} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Manually</Text>
            <TouchableOpacity onPress={() => setShowManual(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Food name"
              value={manualData.name}
              onChangeText={(text) => setManualData({ ...manualData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Carbs (g)"
              keyboardType="numeric"
              value={manualData.carbs}
              onChangeText={(text) => setManualData({ ...manualData, carbs: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Protein (g)"
              keyboardType="numeric"
              value={manualData.protein}
              onChangeText={(text) => setManualData({ ...manualData, protein: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Fat (g)"
              keyboardType="numeric"
              value={manualData.fat}
              onChangeText={(text) => setManualData({ ...manualData, fat: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Fiber (g)"
              keyboardType="numeric"
              value={manualData.fiber}
              onChangeText={(text) => setManualData({ ...manualData, fiber: text })}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleManualAdd}>
              <Text style={styles.addBtnText}>Add</Text>
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
  headerButtons: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8 },
  totals: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#1e293b', marginBottom: 8 },
  totalItem: { alignItems: 'center' },
  totalLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  totalValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logsList: { flex: 1, padding: 16 },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 8 },
  logLeft: { flex: 1 },
  logTime: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  logName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  logMacros: { color: '#94a3b8', fontSize: 12 },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1e293b' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  searchInput: { backgroundColor: '#1e293b', color: '#fff', padding: 12, margin: 16, borderRadius: 8, fontSize: 16 },
  foodList: { flex: 1, padding: 16 },
  foodItem: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 8 },
  foodName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  foodMacros: { color: '#94a3b8', fontSize: 12 },
  form: { padding: 16 },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  addBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
