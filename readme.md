# GramSaathi: Comprehensive Rural Healthcare & Maternal Support

GramSaathi is a mission-driven mobile application designed to bridge the healthcare gap in rural communities. It empowers health workers and patients with intelligent tools for daily health management, with a robust specialized module for maternal health (Pregnancy Mode).

## 🚀 Key Features

### 🤱 Maternal Health (Pregnancy Mode)
- **Weekly Tracking**: Monitor pregnancy progress with visual week-by-week updates and baby size comparisons.
- **ANC Visit Scheduler**: Automatic generation of Antenatal Care schedules based on EDD, with status tracking (Completed, Upcoming, Pending).
- **Automated Verification**: AI-powered OCR scanning of USG reports and ANC cards for instant pregnancy mode activation.
- **ASHA Integration**: Direct connection with local ASHA workers for in-person verification and support.
- **Danger Signs & Nutrition**: Curated guidance on pregnancy red flags and nutritional requirements.

### 🩺 General Healthcare
- **AI Symptom Triage**: Intelligent assessment of symptoms to determine urgency and provide initial guidance.
- **Drug Recommendation Engine**: Evidence-based advisory system for common ailments.
- **PHC & Doctor Locator**: Easily find the nearest Primary Health Centers and available doctors.
- **Family Management**: Add and manage health profiles for the entire family.

### 🌐 Platform Capabilities
- **Multilingual Support**: Fully accessible in English, Hindi, Kannada, and Tamil.
- **Secure Authentication**: WhatsApp-based OTP verification via Twilio for secure and easy access.
- **Offline-First Storage**: Uses SQLite for reliable data access in areas with intermittent connectivity.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (File-based routing)
- **Animations**: React Native Reanimated
- **Database**: expo-sqlite (Local persistent storage)
- **Styling**: Modern dark-themed UI with premium aesthetics.

### Backend Services
- **Auth Service (Node.js)**: Express-based backend for Twilio WhatsApp OTP integration.
- **ML Service (Python)**: FastAPI service hosting machine learning models for triage and drug recommendations.
- **OCR Service (Python)**: Specialized FastAPI service using EasyOCR for medical document processing.

## 📦 Project Structure

```text
├── React_app/MyApp       # Expo Mobile Application
├── backend               # Node.js Auth/OTP Service
├── ML_service            # Python Machine Learning Service
└── DocOCR_service        # Python OCR Document Processing Service
```

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Expo Go app on mobile or emulator

### 2. Installation

#### Mobile App
```bash
cd React_app/MyApp
npm install
npx expo start
```

#### Auth Backend
```bash
cd backend
npm install
# Create .env with TWILIO credentials
node server.js
```

#### ML & OCR Services
```bash
# For both ML_service and DocOCR_service
cd [service_directory]
python -m venv venv
source venv/bin/activate # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port [8000/8001]
```

## 🔒 Security & Privacy
GramSaathi prioritizes patient data privacy. Pregnancy records and medical documents are stored securely, with access restricted based on verified status and gender-appropriate logic (e.g., Pregnancy Mode restricted to female profiles).

---
*Built with ❤️ for digital health inclusion.*
