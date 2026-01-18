# 🌸 Momera: AI-Driven IVF Success Prediction


**Momera** (Mom Era) is a specialized mobile application designed to predict **In Vitro Fertilization (IVF)** outcomes with high precision. Unlike traditional methods that rely on static data (Age/BMI), this research introduces a novel dynamic parameter called **"E2 Velocity"** (Hormone Velocity) to forecast success probabilities in resource-constrained settings.

---

## 🚀 Research Problem & Solution

### 🔴 The Problem
* **High Failure Rates:** IVF success rates hover around 30-40%.
* **Financial Burden:** A single cycle costs ~2 Lakhs. Patients often pay for cycles that are destined to fail.
* **Static Prediction:** Doctors currently rely on static metrics like **Age** and **BMI**, which fail to capture the patient's real-time biological response to drugs.

### 🟢 Momera's Solution
Momera shifts the paradigm from **"Guessing"** to **"Tracking"**:
* It analyzes the **Rate of Change (Velocity)** of Estradiol hormone levels during stimulation.
* It uses **Machine Learning (XGBoost)** to predict whether a cycle will result in a **"Live Birth"** or **"Cycle Cancellation"**.
* **Goal:** To save financial resources by identifying poor responders *early* in the treatment process.

---

## ✨ Key Features

### 1. 🧬 E2 Velocity Calculation
* The core innovation of this project.
* Calculates the precise **speed** at which hormone levels rise between **Day 2 (Baseline)** and **Trigger Day**.
* Formula: `(Trigger E2 - Day 2 E2) / Stimulation Days`.

### 2. 🤖 AI-Based Outcome Prediction
* Integrates clinical data (Age, BMI, AFC, E2 Levels) into an **XGBoost** model.
* Provides a probabilistic score ( **90% Success Probability**) to assist clinicians.

### 3. 📉 Cost-Saving Decision Support
* Acts as a **Clinical Decision Support System (CDSS)**.
* Helps doctors decide whether to proceed with expensive procedures (Egg Retrieval) or cancel the cycle to save the patient's money.

### 4. 📱 User-Friendly Interface
* Simple, clean interface for doctors/patients to input cycle data and view prediction results instantly.

---

## 🛠 Tech Stack

* **Frontend Framework:** [React Native](https://reactnative.dev/)
* **Platform:** [Expo](https://expo.dev/) (Managed Workflow)
* **Algorithm Logic:** Machine Learning (XGBoost )
* **Language:** JavaScript / TypeScript

---



## 🏁 Getting Started

Follow these instructions to run the prototype locally.

### Prerequisites
* **Node.js** (v14 or newer)
* **npm** or **yarn**
* **Expo Go** App (on your mobile device)

### Installation Steps

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/GnanasampanthanThivakar/ivf_research.git
    cd ivf_research
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start the Server**
    ```bash
    npx expo start
    ```

4.  **Run on Mobile**
    * Scan the QR code shown in the terminal using the **Expo Go** app (Android/iOS).

---

## 🗺 Roadmap

- [x] **Phase 1:** UI Architecture & Data Input Modules.
- [x] **Phase 2:** Implementation of "E2 Velocity" Calculation Logic.
- [ ] **Phase 3:** Integration of Pre-trained ML Model (TensorFlow.js / API).
- [ ] **Phase 4:** Validation with Retrospective Clinical Data.

---

## ⚠️ Disclaimer

**Momera** is a **research prototype** designed for educational and academic purposes. It is **not** a certified medical device and should not be used as a substitute for professional clinical judgment.

---

## 📞 Author & Contact

**Gnanasampanthan Thivakar**

* **GitHub:** [GnanasampanthanThivakar](https://github.com/GnanasampanthanThivakar)
