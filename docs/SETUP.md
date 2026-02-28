# 📱 Tally App - Setup Guide

## Prerequisites

### Required Accounts
1. **Apple Developer Account** ($99/year)
   - Go to: https://developer.apple.com
   - Enroll in Apple Developer Program
   - Wait 24-48 hours for approval

2. **Google Play Developer Account** ($25 one-time)
   - Go to: https://play.google.com/console
   - Pay registration fee
   - Instant approval

### Required Software

#### For iOS Development (Mac Only)
- **macOS** Sonoma or later
- **Xcode** 15+ (from Mac App Store)
- **CocoaPods** (run: `sudo gem install cocoapods`)
- **Node.js** 18+ (from nodejs.org)

#### For Android Development (Mac, Windows, Linux)
- **Android Studio** (from developer.android.com)
- **Java JDK** 17+
- **Node.js** 18+

---

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
cd tally-app
npm install
```

### Step 2: Initialize Capacitor
```bash
npm run cap:init
```

### Step 3: Add Platforms
```bash
# Add iOS (Mac only)
npm run cap:add:ios

# Add Android
npm run cap:add:android
```

### Step 4: Sync Web Code to Native
```bash
npm run cap:sync
```

### Step 5: Open in IDEs
```bash
# Open iOS in Xcode (Mac only)
npm run cap:open:ios

# Open Android in Android Studio
npm run cap:open:android
```

---

## 🍎 iOS Build Instructions

### 1. Configure in Xcode
1. Open project in Xcode
2. Select **"App"** target
3. Go to **"Signing & Capabilities"**
4. Select your **Team** (Apple Developer Account)
5. Change **Bundle Identifier** to your unique ID (e.g., `com.yourname.tally`)

### 2. Add App Icon
1. Find `Assets.xcassets` in Xcode
2. Click `AppIcon`
3. Drag your icon files to each size slot
4. **Sizes needed:** 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

### 3. Test on Device
1. Connect iPhone via USB
2. Select your iPhone from device dropdown
3. Click ▶️ **Run** button
4. Accept "Trust This Computer" on iPhone
5. App installs and launches!

### 4. Build for TestFlight (Beta Testing)
1. In Xcode: **Product** → **Archive**
2. Wait for archive to complete
3. Click **Distribute App**
4. Select **App Store Connect**
5. Upload and wait for processing
6. In App Store Connect, add to TestFlight
7. Invite beta testers!

### 5. Submit to App Store
1. Complete app listing in App Store Connect
2. Upload build (from step 4)
3. Fill out required info:
   - Screenshots (5-10)
   - Description
   - Keywords
   - Category
   - Age rating
   - Privacy policy URL
4. Submit for review
5. **Wait 7-10 days** for approval

---

## 🤖 Android Build Instructions

### 1. Configure in Android Studio
1. Open project in Android Studio
2. Wait for Gradle sync
3. Open `android/app/build.gradle`
4. Update `applicationId` to your unique ID

### 2. Add App Icon
1. Right-click `app/src/main/res`
2. Select **New** → **Image Asset**
3. Choose **"Launcher Icons"**
4. Upload your icon (512x512 recommended)
5. Generate icons

### 3. Test on Device
1. Enable **Developer Options** on Android device
2. Enable **USB Debugging**
3. Connect via USB
4. Click ▶️ **Run** button in Android Studio
5. Select your device
6. App installs and launches!

### 4. Build Release APK
```bash
cd android
./gradlew assembleRelease
```
APK location: `android/app/build/outputs/apk/release/app-release.apk`

### 5. Build App Bundle (for Play Store)
```bash
cd android
./gradlew bundleRelease
```
Bundle location: `android/app/build/outputs/bundle/release/app-release.aab`

### 6. Sign Your App
1. Generate keystore:
```bash
keytool -genkey -v -keystore tally-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias tally
```
2. Add signing config to `android/app/build.gradle`
3. **Keep keystore safe!** You'll need it for all future updates

### 7. Submit to Play Store
1. Go to Play Console: https://play.google.com/console
2. Create new app
3. Fill out app details
4. Upload app bundle (.aab file)
5. Complete store listing:
   - Screenshots (4-8)
   - Feature graphic
   - Description
   - Category
   - Privacy policy URL
6. Submit for review
7. **Wait 2-3 days** for approval

---

## 🔧 Development Workflow

### Making Changes
1. Edit `www/index.html` (your web app)
2. Test in browser first
3. Sync changes: `npm run cap:sync`
4. Test in Xcode/Android Studio
5. Repeat!

### Updating Native Code
```bash
# After changing web code
npm run cap:sync

# After adding Capacitor plugins
npm run cap:sync
```

---

## 📊 Testing Checklist

### Before Each Release
- [ ] Test on multiple screen sizes
- [ ] Test on iOS (minimum version 13.0)
- [ ] Test on Android (minimum version 8.0)
- [ ] Test bill adding/editing/deleting
- [ ] Test debt tracking
- [ ] Test calculator
- [ ] Test data persistence
- [ ] Test export features (Pro)
- [ ] Test in-app purchase flow
- [ ] Check all links work
- [ ] Verify privacy policy is accessible

---

## 🐛 Common Issues

### iOS Build Fails
**Problem:** Code signing error  
**Solution:** Check Signing & Capabilities in Xcode, ensure team is selected

**Problem:** "Untrusted Developer" on device  
**Solution:** Go to Settings → General → VPN & Device Management → Trust your developer certificate

### Android Build Fails
**Problem:** Gradle sync failed  
**Solution:** Tools → SDK Manager → Install latest SDK Platform and Build Tools

**Problem:** App won't install  
**Solution:** Uninstall old version first, or increase `versionCode` in build.gradle

### General Issues
**Problem:** Changes not showing  
**Solution:** Run `npm run cap:sync` after every web code change

**Problem:** White screen on launch  
**Solution:** Check browser console for errors, verify all assets load correctly

---

## 📱 Device Testing Requirements

### iOS Devices
- Test on: iPhone SE (smallest), iPhone 15 Pro Max (largest)
- Test on: iPad (if supporting tablets)
- Test iOS versions: 13.0, 15.0, 17.0+

### Android Devices
- Test on: Small phone (5"), Large phone (6.5"+)
- Test on: Tablet (if supporting)
- Test Android versions: 8.0, 10.0, 14.0+

---

## 💰 In-App Purchase Setup

### iOS (App Store Connect)
1. Go to App Store Connect
2. Select your app
3. Go to **Features** → **In-App Purchases**
4. Create **Auto-Renewable Subscription**
5. Add products:
   - Monthly: `tally_pro_monthly` ($2.99)
   - Yearly: `tally_pro_yearly` ($24.99)

### Android (Play Console)
1. Go to Play Console
2. Select your app
3. Go to **Monetize** → **Subscriptions**
4. Create subscriptions:
   - Monthly: `tally_pro_monthly` ($2.99)
   - Yearly: `tally_pro_yearly` ($24.99)

---

## 🔐 Required Legal Documents

### 1. Privacy Policy
- Required by both app stores
- Must disclose data collection
- Host on website or GitHub Pages
- Include URL in app store listing

### 2. Terms of Service
- Required for IAP
- Must include subscription terms
- Host publicly accessible

### 3. Support Page
- Contact email required
- Can be simple webpage
- Include in app and app store listing

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] App thoroughly tested on real devices
- [ ] Screenshots taken (iOS: 5.5", 6.5" | Android: Phone, Tablet)
- [ ] App icon finalized (1024x1024)
- [ ] Privacy policy live and accessible
- [ ] Terms of service live
- [ ] Support email set up
- [ ] Promo website created (optional but recommended)

### App Store Submission
- [ ] iOS: Submitted to App Store Connect
- [ ] Android: Submitted to Play Console
- [ ] Beta testers invited (TestFlight/Internal Testing)
- [ ] All store listing fields completed
- [ ] Age rating questionnaire completed
- [ ] Export compliance filled out (iOS)

### Post-Launch
- [ ] Monitor reviews daily
- [ ] Respond to user feedback
- [ ] Track analytics (downloads, active users)
- [ ] Plan updates and improvements
- [ ] Market on social media
- [ ] Submit to Product Hunt, Indie Hackers

---

## 📧 Support

**Questions?** Create an issue in the repo or email: support@tally-app.com

**Good luck with your launch! 🚀**
