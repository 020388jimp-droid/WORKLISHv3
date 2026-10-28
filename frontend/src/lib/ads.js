import { Capacitor } from '@capacitor/core';

// Google's official test interstitial ID (always shows a test ad)
const TEST_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712';
// Real ID para producción (cambiar cuando la app esté publicada)
const REAL_AD_UNIT_ID = 'ca-app-pub-2117478825464003/3321613199';

const AD_UNIT_ID = REAL_AD_UNIT_ID; // Usar ID real para Producción

export const showInterstitialAd = async (userProfile) => {
  console.log('[ADS] showInterstitialAd called', {
    isNative: Capacitor.isNativePlatform(),
    status: userProfile?.subscription_status
  });

  if (!Capacitor.isNativePlatform()) {
    console.log('[ADS] Skipping: not native platform');
    return;
  }

  const noAdStatuses = ['pro', 'enterprise', 'trial'];
  if (noAdStatuses.includes(userProfile?.subscription_status)) return;

  try {
    const admobModule = await import('@capacitor-community/admob');
    const AdMob = admobModule.AdMob;
    console.log('[ADS] AdMob loaded, preparing interstitial...');

    await AdMob.prepareInterstitial({ adId: AD_UNIT_ID });
    console.log('[ADS] Interstitial prepared, showing...');
    await AdMob.showInterstitial();
    console.log('[ADS] Interstitial shown successfully');
  } catch (err) {
    console.error('[ADS] Error showing interstitial ad:', err);
  }
};
