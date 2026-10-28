import { Capacitor } from '@capacitor/core';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const REVENUECAT_API_KEY = 'goog_poJsSAMrMGDkOEFxYieAWGZLpoq';

export const RevenueCatService = {
  /**
   * Inicializa el SDK de RevenueCat
   */
  initialize: async (uid) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      
      // Configurar SDK
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: uid,
      });

      console.log('[RevenueCat] SDK Initialized for user:', uid);

      // Configurar listener para cambios en la suscripción
      Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
        await RevenueCatService.syncSubscriptionStatus(uid, customerInfo);
      });

    } catch (error) {
      console.error('[RevenueCat] Initialization Error:', error);
    }
  },

  /**
   * Sincroniza el estado de la suscripción de RevenueCat con Firestore
   */
  syncSubscriptionStatus: async (uid, customerInfo) => {
    if (!uid) return;

    try {
      let status = 'free';
      
      // Verificar entitlements activos
      if (customerInfo.entitlements.active['pro']) {
        status = 'pro';
      } else if (customerInfo.entitlements.active['enterprise']) {
        status = 'enterprise';
      }

      console.log(`[RevenueCat] Syncing status: ${status} for user: ${uid}`);

      // Actualizar Firestore
      await setDoc(doc(db, 'users', uid), {
        subscription_status: status,
        last_billing_sync: new Date().toISOString()
      }, { merge: true });

      return status;
    } catch (error) {
      console.error('[RevenueCat] Sync Error:', error);
    }
  },

  /**
   * Obtiene los productos disponibles para la venta
   */
  getOfferings: async () => {
    if (!Capacitor.isNativePlatform()) return null;

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('[RevenueCat] Error getting offerings:', error);
      return null;
    }
  },

  /**
   * Procesa la compra de un paquete
   */
  purchasePackage: async (pkg) => {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Purchases only available on native platforms');
    }

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.purchasePackage({
        aPackage: pkg
      });
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Purchase Error:', error);
      throw error;
    }
  },

  /**
   * Restaura compras anteriores
   */
  restorePurchases: async () => {
    if (!Capacitor.isNativePlatform()) return null;

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Restore Error:', error);
      throw error;
    }
  }
};
