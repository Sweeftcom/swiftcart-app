# Sweeftcom Scaling & Optimization Guide

This guide ensures the React Native application remains "Butter Smooth" on Tier-2 city hardware as we scale to 100+ orders/day.

---

## 🚀 1. JavaScript Engine (Hermes)
Hermes is the default for modern React Native, but we must ensure it is explicitly optimized for production.

**File:** `android/app/build.gradle`
```gradle
project.ext.react = [
    enableHermes: true,  // Should be true for better startup time and memory footprint
]
```

## 🛡️ 2. Build Optimization (ProGuard/R8)
As we scale, APK size and code obfuscation become critical for security and low-end device compatibility.

**File:** `android/app/build.gradle`
```gradle
def enableProguardInReleaseBuilds = true
```
*Action:* Run `./gradlew bundleRelease` to generate the highly optimized `.aab` file for the Google Play Store.

## 🖼️ 3. Image Optimization
Quick commerce relies heavily on product imagery.
- **Action:** Transition all product images to **WebP** format.
- **Library:** Use `react-native-fast-image` for aggressive disk caching.

## 📡 4. Network Layer (Scaling)
- **Batching:** Instead of multiple RPC calls, use the `apply_coupon` and `place_order_atomic` functions to reduce RTT (Round Trip Time).
- **Offline First:** Ensure `supabase.auth` storage is using `AsyncStorage` to prevent auth-loops in poor CIDCO network zones.

## 🔒 5. Final Security Audit (RLS)
Ensure the following policies are strictly enforced:
- [x] **Financial Isolation:** No vendor can see the `wallets` or `payout_requests` of another store owner.
- [x] **Driver Privacy:** Rider phone numbers are masked in the Customer App.
- [x] **Admin Override:** Only the specific `admin` role can trigger `reassign_order_manually`.
