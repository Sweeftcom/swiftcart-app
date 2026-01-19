# Sweeftcom Launch Day Checklist (Pilot Phase)

Status: **Production Ready**
Area: **Aurangabad (CIDCO / Nirala Bazar)**

### 1. Database & Security
- [ ] **DB Backup:** Trigger a manual snapshot of the Supabase production database.
- [ ] **RLS Audit:** Verify that `profiles.role` correctly restricts access to Vendor/Rider/Admin functions.
- [ ] **OTP Trigger:** Confirm that `tr_generate_delivery_otp` is active on the `orders` table.

### 2. Real-time & Connectivity
- [ ] **Replication Check:** Verify Supabase Realtime is enabled for `orders` and `drivers` tables.
- [ ] **FCM Tokens:** Ensure at least 5 pilot riders have updated FCM tokens in their profiles.
- [ ] **Edge Functions:** Check `notify-order` logs to ensure FCM HTTP v1 handshakes are succeeding.

### 3. Inventory & Stores
- [ ] **Onboarding:** Verify the first 3 dark stores have their `store_inventory` seeded.
- [ ] **Low Stock Alerts:** Manually test a stock reduction to ensure the `StoreInventory.tsx` warning appears.

### 4. Rider Readiness
- [ ] **App Version:** Ensure all riders are on the latest production build (Android 14+ / iOS).
- [ ] **Background GPS:** Confirm "Always Allow" location permission is granted for background tracking.
- [ ] **Handshake Training:** Riders must know they **cannot** complete delivery without the 4-digit customer OTP.

### 5. Fault Tolerance & Monitoring
- [ ] **Error Logs:** Verify Sentry/LogSnag is receiving heartbeat signals from pilot devices.
- [ ] **Offline Mode:** Ensure the Supabase client `persistSession: true` is working for poor network zones.
- [ ] **Emergency Kill-Switch:** Confirm Admin can manually force-close the store in case of extreme load.

---
*Success Metric: First 10 orders delivered with < 15 min SLA and zero critical app crashes.*
