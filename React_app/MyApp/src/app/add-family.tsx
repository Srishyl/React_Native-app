import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import db from '../database/db';

const RELATIONS = ['Father', 'Mother', 'Husband', 'Wife', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];
const BP_SUGAR_OPTIONS = ['None', 'BP only', 'Sugar only', 'Both'];

export default function AddFamilyScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [relation, setRelation] = useState('');
    const [hasBpSugar, setHasBpSugar] = useState('None');
    const [disease, setDisease] = useState('');
    const [saving, setSaving] = useState(false);

    const numericAge = parseInt(age) || 0;
    const isAged = numericAge > 40;

    const handleSave = async () => {
        if (!name.trim() || !age.trim() || !relation) {
            Alert.alert('Missing Fields', 'Please fill in Name, Age, and Relation.');
            return;
        }

        if (!phone) {
            Alert.alert('Error', 'Patient connection lost. Please login again.');
            return;
        }

        setSaving(true);
        try {
            const finalBpSugar = isAged ? hasBpSugar : 'None';

            await db.runAsync(
                `INSERT INTO family_members (patient_phone, name, age, relation, has_bp_sugar, disease)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [phone, name.trim(), numericAge, relation, finalBpSugar, disease.trim()]
            );

            Alert.alert('Success', `${name} has been added to your family profile!`, [
                {
                    text: 'OK',
                    onPress: () => router.back()
                }
            ]);
        } catch (error) {
            console.error('Failed to add family member:', error);
            Alert.alert('Database Error', 'Could not save the family member.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                    {/* Header */}
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add Member</Text>
                        <View style={{ width: 60 }} />
                    </Animated.View>

                    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={{ marginBottom: 24 }}>
                            <Text style={styles.title}>Family Details</Text>
                            <Text style={styles.subtitle}>Add your loved ones to keep track of their health records together.</Text>
                        </Animated.View>

                        {/* Name and Age */}
                        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.rowLayout}>
                            <View style={[styles.inputGroup, { flex: 2, marginRight: 12 }]}>
                                <Text style={styles.label}>Full Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Ramesh"
                                    placeholderTextColor="#4A6280"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Age *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Yrs"
                                    placeholderTextColor="#4A6280"
                                    keyboardType="numeric"
                                    value={age}
                                    onChangeText={setAge}
                                    maxLength={3}
                                />
                            </View>
                        </Animated.View>

                        {/* Relation */}
                        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.inputGroup}>
                            <Text style={styles.label}>Relationship *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
                                {RELATIONS.map(rel => (
                                    <TouchableOpacity
                                        key={rel}
                                        style={[styles.chipBadge, relation === rel && styles.chipActive]}
                                        onPress={() => setRelation(rel)}
                                    >
                                        <Text style={[styles.chipText, relation === rel && styles.chipTextActive]}>{rel}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </Animated.View>

                        {/* Conditional Logic: BP/Sugar if Age > 40 */}
                        {isAged && (
                            <Animated.View
                                entering={FadeInDown.duration(400)}
                                exiting={FadeOutUp.duration(300)}
                                style={styles.conditionalBox}
                            >
                                <Text style={styles.label}>Do they have BP or Sugar?</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                    {BP_SUGAR_OPTIONS.map(opt => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.chipBadge, hasBpSugar === opt && styles.chipActive]}
                                            onPress={() => setHasBpSugar(opt)}
                                        >
                                            <Text style={[styles.chipText, hasBpSugar === opt && styles.chipTextActive]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Animated.View>
                        )}

                        {/* Other Diseases */}
                        <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.inputGroup}>
                            <Text style={styles.label}>Any other diseases or conditions? (Optional)</Text>
                            <TextInput
                                style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                                placeholder="Describe any known allergies, chronic diseases, or past surgeries..."
                                placeholderTextColor="#4A6280"
                                multiline
                                value={disease}
                                onChangeText={setDisease}
                            />
                        </Animated.View>

                    </ScrollView>

                    {/* Footer Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Add Family Member'}</Text>
                        </TouchableOpacity>
                    </View>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1B2E' },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: '#0D1B2E',
    },
    backBtn: { paddingVertical: 8, paddingRight: 16 },
    backText: { color: '#9BB4D0', fontSize: 15, fontWeight: '600' },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 },

    title: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginBottom: 8 },
    subtitle: { color: '#9BB4D0', fontSize: 14, lineHeight: 21, marginBottom: 20 },

    rowLayout: { flexDirection: 'row', alignItems: 'center' },
    inputGroup: { marginBottom: 20 },
    label: { color: '#C8D8EA', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: {
        backgroundColor: '#132236',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#FFFFFF',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#1E3A5A',
    },

    chipBadge: {
        backgroundColor: '#132236',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#1E3A5A',
    },
    chipActive: {
        backgroundColor: '#3D8EFF',
        borderColor: '#3D8EFF',
    },
    chipText: { color: '#9BB4D0', fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: '#FFFFFF', fontWeight: '700' },

    conditionalBox: {
        backgroundColor: '#162842',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2A4365',
        marginBottom: 20,
    },

    footer: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 10 : 20,
        paddingTop: 16,
        backgroundColor: '#0D1B2E',
    },
    saveBtn: {
        backgroundColor: '#3D8EFF',
        paddingVertical: 18,
        borderRadius: 50,
        alignItems: 'center',
    },
    saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
