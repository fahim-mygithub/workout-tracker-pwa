export interface PWAUpdateInfo {
  isUpdateAvailable: boolean;
  updateServiceWorker: () => Promise<void>;
}

export function registerSW(): PWAUpdateInfo {
  let updateSW: (() => Promise<void>) | undefined;

  const updateInfo: PWAUpdateInfo = {
    isUpdateAvailable: false,
    updateServiceWorker: async () => {
      if (updateSW) {
        await updateSW();
      }
    }
  };

  if ('serviceWorker' in navigator) {
    // Dynamic import to handle the service worker registration
    import('virtual:pwa-register').then(({ registerSW }) => {
      updateSW = registerSW({
        onNeedRefresh() {
          updateInfo.isUpdateAvailable = true;
          console.log('New content available, please refresh.');
        },
        onOfflineReady() {
          console.log('App ready to work offline.');
        },
      });
    }).catch(error => {
      console.error('Failed to register service worker:', error);
    });
  }

  return updateInfo;
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function addOfflineListener(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function getInstallPromptEvent(): Promise<BeforeInstallPromptEvent | null> {
  return new Promise((resolve) => {
    if ('BeforeInstallPromptEvent' in window) {
      window.addEventListener('beforeinstallprompt', (e) => {
        resolve(e as BeforeInstallPromptEvent);
      });
    } else {
      resolve(null);
    }
  });
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}