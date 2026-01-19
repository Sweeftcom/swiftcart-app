import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { MapPin, Clock, ShoppingBag, ChevronRight } from 'lucide-react-native';
import { OrderService } from '../../services/OrderService';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width - 48;
const SLIDE_THRESHOLD = BUTTON_WIDTH - 80;

/**
 * Rider Order Acceptance Screen
 * "Blinkit-level" UI with a sliding "Accept" button.
 */
export const OrderAcceptance = ({ route }: any) => {
  const { order } = route.params || { order: { id: 'mock-1', store: { name: 'Dark Store 01' } } };
  const [isAccepting, setIsAccepting] = useState(false);

  const translateX = useSharedValue(0);

  const handleComplete = async () => {
    try {
      setIsAccepting(true);
      await OrderService.riderAccept(order.id, 'current-driver-id');
      // Navigation would go here
    } catch (error) {
      translateX.value = withSpring(0);
      setIsAccepting(false);
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      if (isAccepting) return;
      translateX.value = Math.max(0, Math.min(event.translationX, SLIDE_THRESHOLD));
    },
    onEnd: (event) => {
      if (isAccepting) return;
      if (event.translationX > SLIDE_THRESHOLD * 0.8) {
        translateX.value = withSpring(SLIDE_THRESHOLD);
        runOnJS(handleComplete)();
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SLIDE_THRESHOLD], [1, 0], Extrapolate.CLAMP),
  }));

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>New Delivery!</Text>
        <Text style={styles.subtitle}>Earnings: ₹45.00</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconContainer, { backgroundColor: '#22C55E20' }]}>
            <ShoppingBag color="#22C55E" size={24} />
          </View>
          <View>
            <Text style={styles.label}>{order.store.name}</Text>
            <Text style={styles.sublabel}>Pick up from Dark Store</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
            <MapPin color="#3B82F6" size={24} />
          </View>
          <View>
            <Text style={styles.label}>2.4 km away</Text>
            <Text style={styles.sublabel}>Delivery to Nirala Bazar</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.iconContainer, { backgroundColor: '#F9731620' }]}>
            <Clock color="#F97316" size={24} />
          </View>
          <View>
            <Text style={styles.label}>8 mins</Text>
            <Text style={styles.sublabel}>Delivery Deadline</Text>
          </View>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <Animated.Text style={[styles.sliderText, animatedTextStyle]}>
          SLIDE TO ACCEPT
        </Animated.Text>

        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.sliderButton, animatedButtonStyle]}>
            <ChevronRight color="black" size={32} />
          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24, justifyContent: 'space-between' },
  title: { color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 18 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 24, borderSize: 1, borderColor: '#333' } as any,
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconContainer: { padding: 12, borderRadius: 99, marginRight: 16 },
  label: { color: 'white', fontSize: 18, fontWeight: '600' },
  sublabel: { color: '#666', fontSize: 14 },
  sliderContainer: {
    height: 80,
    backgroundColor: '#333',
    borderRadius: 40,
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  sliderText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    position: 'absolute',
    width: '100%',
    zIndex: 0
  },
  sliderButton: {
    width: 64,
    height: 64,
    backgroundColor: '#E5F942',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  }
});
