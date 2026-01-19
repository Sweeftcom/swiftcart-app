# Sweeftcom Production Deployment Guide

## 📡 1. Supabase Staging to Production Sync

To move from your "Logic-Ready" staging to "Operation-Live" production, follow these steps:

### Step A: Schema Migration
Run all `.sql` files from the `supabase/migrations/` directory against your production Supabase database in order.
1. Go to the **Supabase SQL Editor** on your Production Dashboard.
2. Paste the contents of each migration sequentially (Start from 20260107... up to 20260123...).

### Step B: Edge Functions Deployment
Deploy your functions to the production project using the Supabase CLI:
```bash
supabase link --project-ref <your-production-project-id>
supabase functions deploy process-order
supabase functions deploy notify-order
supabase functions deploy calculate-surge
supabase functions deploy generate-invoice
```

### Step C: Environment Variables
Ensure the following Secrets are set in the Production Supabase Dashboard:
- `FCM_PROJECT_ID`
- `FCM_ACCESS_TOKEN`
- `ADMIN_USER_ID` (Your CTOO UUID)

---

## 🤖 2. Android Signed APK/App Bundle Generation

Follow these steps using the React Native CLI to generate your production release.

### Step 1: Generate Keystore (One-time)
If you don't have one, generate a release keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
*Note:* Place `my-release-key.keystore` inside the `android/app` directory.

### Step 2: Configure `gradle.properties`
Add your credentials to `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

### Step 3: Bundle Release
Run the following commands from the project root:
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```
*Result:* The optimized `.aab` file will be at `android/app/build/outputs/bundle/release/app-release.aab`.

---

## 🍏 3. iOS App Store Submission
1. Open `ios/Sweeftcom.xcworkspace` in Xcode.
2. Select **Product > Archive**.
3. Once archived, click **Distribute App** and follow the App Store Connect prompts.
