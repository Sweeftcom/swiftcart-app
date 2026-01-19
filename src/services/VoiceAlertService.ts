// VoiceAlertService for Sweeftcom Vendor App
// Optimized for noisy shop environments in Aurangabad.

/**
 * VoiceAlertService
 * Plays high-awareness Marathi/Hindi audio prompts.
 */
export class VoiceAlertService {
  private static isSpeaking = false;

  /**
   * Alert Vendor in Marathi: "Navin Order Ali Ahe" (New order has arrived)
   */
  static async playNewOrderMarathi() {
    if (this.isSpeaking) return;
    this.isSpeaking = true;

    // In a real React Native environment:
    // import Tts from 'react-native-tts';
    // Tts.setDefaultLanguage('mr-IN');
    // Tts.speak('नवीन ऑर्डर आली आहे');

    console.log("[VOICE ALERT]: नवीन ऑर्डर आली आहे (Navin Order Ali Ahe)");

    // Safety timeout to prevent overlap
    setTimeout(() => {
      this.isSpeaking = false;
    }, 5000);
  }

  /**
   * Urgent Escalation Alert
   */
  static async playUrgentEscalation() {
    console.log("[VOICE ALERT]: कृपया ऑर्डर स्वीकारा (Please accept the order)");
  }
}
