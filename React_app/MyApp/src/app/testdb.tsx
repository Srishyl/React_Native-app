import React from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';
import db from '../database/db';

export default function TestDB() {
  const router = useRouter();

  const insertTestData = async () => {
    try {
      await db.runAsync(
        `INSERT INTO patients 
        (id, symptoms, predicted_disease, severity_level, timestamp, synced)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          Date.now().toString(),
          JSON.stringify(['fever', 'cough']),
          'Common Cold',
          'Mild',
          new Date().toISOString(),
          0
        ]
      );

      console.log('Inserted successfully');
    } catch (error) {
      console.log('Insert error:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const result = await db.getAllAsync(`SELECT * FROM patients`);
      console.log('Patients:', result);
    } catch (error) {
      console.log('Fetch error:', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        SQLite Test Screen
      </Text>

      <Button title="Insert Test Patient" onPress={insertTestData} />
      <View style={{ height: 20 }} />
      <Button title="Fetch Patients" onPress={fetchPatients} />
      <View style={{ height: 40 }} />
      <Button title="Go Back Home" onPress={() => router.replace('/')} color="#2E7D32" />
    </View>
  );
}