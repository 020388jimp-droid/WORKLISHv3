import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Inicialización dinámica para evitar que las librerías nativas rompan la Web
  import('@revenuecat/purchases-capacitor').then(({ Purchases, LOG_LEVEL }) => {
    Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    Purchases.configure({ apiKey: "test_GvBlSHiCZqaASqVLYplvDTAqAHu" })
      .catch(err => console.error("Error init RevenueCat:", err));
  }).catch(err => console.error("Failed to load RevenueCat:", err));
    
  import('@capacitor-community/admob').then(({ AdMob }) => {
    AdMob.initialize({
      testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
      initializeForTesting: true,
    }).catch(err => console.error("Error init AdMob:", err));
  }).catch(err => console.error("Failed to load AdMob:", err));
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '20px', backgroundColor: '#0f0f1a', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>React Crash Detected:</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// PWA: Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Worklish PWA: Service Worker Registered');
      })
      .catch(error => {
        console.log('Worklish PWA: SW Registration Failed', error);
      });
  });
}
