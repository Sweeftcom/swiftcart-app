import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Star, Smile, Frown, Rocket } from 'lucide-react-native';
import { supabase } from '../../lib/react-native/supabase-client';

/**
 * PilotFeedbackSurvey
 * Post-delivery 30-second survey for pilot insights.
 */
export const PilotFeedbackSurvey = ({ orderId, onSuccess }: { orderId: string, onSuccess: () => void }) => {
  const [rating, setRating] = useState(0);
  const [wasFast, setWasFast] = useState<boolean | null>(null);
  const [polite, setPolite] = useState<boolean | null>(null);
  const [glitches, setGlitches] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('pilot_insights')
      .insert({
        order_id: orderId,
        user_id: user?.id,
        rating,
        was_fast: wasFast,
        rider_polite: polite,
        app_glitches: glitches
      });

    if (!error) {
      onSuccess();
    }
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How was Sweeftcom?</Text>
      <Text style={styles.subtitle}>Help us win Aurangabad's trust!</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Rate your experience</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Star
                fill={rating >= s ? '#E5F942' : 'transparent'}
                color={rating >= s ? '#E5F942' : '#333'}
                size={32}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.questionRow}>
        <Text style={styles.questionText}>Was the delivery fast?</Text>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.miniBtn, wasFast === true && styles.activeBtn]}
            onPress={() => setWasFast(true)}
          >
            <Smile color={wasFast === true ? 'black' : '#888'} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniBtn, wasFast === false && styles.activeBtn]}
            onPress={() => setWasFast(false)}
          >
            <Frown color={wasFast === false ? 'black' : '#888'} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Any app glitches? (Optional)"
        placeholderTextColor="#444"
        value={glitches}
        onChangeText={setGlitches}
        multiline
      />

      <TouchableOpacity
        style={[styles.submitBtn, rating === 0 && styles.disabledBtn]}
        disabled={rating === 0 || submitting}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={styles.submitText}>SUBMIT FEEDBACK</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#111', padding: 24, borderRadius: 32, borderSize: 1, borderColor: '#333' } as any,
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 24 },
  section: { alignItems: 'center', marginBottom: 24 },
  label: { color: '#666', fontSize: 12, textTransform: 'uppercase', marginBottom: 12 },
  stars: { flexDirection: 'row', gap: 12 },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  questionText: { color: 'white', fontSize: 16 },
  buttons: { flexDirection: 'row', gap: 12 },
  miniBtn: { width: 44, height: 44, backgroundColor: '#1A1A1A', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  activeBtn: { backgroundColor: '#E5F942' },
  input: { backgroundColor: '#000', color: 'white', borderRadius: 16, padding: 16, height: 80, marginBottom: 24 },
  submitBtn: { backgroundColor: '#E5F942', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { backgroundColor: '#333' },
  submitText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});
