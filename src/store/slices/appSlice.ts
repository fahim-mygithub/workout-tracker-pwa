import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in ms, undefined means persistent
  timestamp: string;
}

export interface AppModal {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  isOpen: boolean;
}

interface AppState {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  notifications: AppNotification[];
  activeModal: AppModal | null;
  isLoading: boolean;
  globalError: string | null;
  lastSyncTime: string | null;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
}

const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getOrientation = (): 'portrait' | 'landscape' => {
  if (typeof window === 'undefined') return 'portrait';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

const initialState: AppState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isInstalled: false,
  canInstall: false,
  updateAvailable: false,
  syncStatus: 'idle',
  notifications: [],
  activeModal: null,
  isLoading: false,
  globalError: null,
  lastSyncTime: null,
  deviceType: getDeviceType(),
  orientation: getOrientation(),
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },

    setInstallStatus: (state, action: PayloadAction<boolean>) => {
      state.isInstalled = action.payload;
    },

    setCanInstall: (state, action: PayloadAction<boolean>) => {
      state.canInstall = action.payload;
    },

    setUpdateAvailable: (state, action: PayloadAction<boolean>) => {
      state.updateAvailable = action.payload;
    },

    setSyncStatus: (state, action: PayloadAction<'idle' | 'syncing' | 'success' | 'error'>) => {
      state.syncStatus = action.payload;
      if (action.payload === 'success') {
        state.lastSyncTime = new Date().toISOString();
      }
    },

    addNotification: (state, action: PayloadAction<Omit<AppNotification, 'id' | 'timestamp'>>) => {
      const notification: AppNotification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    openModal: (state, action: PayloadAction<Omit<AppModal, 'isOpen'>>) => {
      state.activeModal = {
        ...action.payload,
        isOpen: true,
      };
    },

    closeModal: (state) => {
      if (state.activeModal) {
        state.activeModal.isOpen = false;
      }
    },

    clearModal: (state) => {
      state.activeModal = null;
    },

    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setGlobalError: (state, action: PayloadAction<string>) => {
      state.globalError = action.payload;
    },

    clearGlobalError: (state) => {
      state.globalError = null;
    },

    setDeviceType: (state, action: PayloadAction<'mobile' | 'tablet' | 'desktop'>) => {
      state.deviceType = action.payload;
    },

    setOrientation: (state, action: PayloadAction<'portrait' | 'landscape'>) => {
      state.orientation = action.payload;
    },

    // Convenience action for showing success messages
    showSuccess: (state, action: PayloadAction<{ title: string; message: string; duration?: number }>) => {
      const notification: AppNotification = {
        ...action.payload,
        type: 'success',
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },

    // Convenience action for showing error messages
    showError: (state, action: PayloadAction<{ title: string; message: string; duration?: number }>) => {
      const notification: AppNotification = {
        ...action.payload,
        type: 'error',
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },

    // Convenience action for showing warning messages
    showWarning: (state, action: PayloadAction<{ title: string; message: string; duration?: number }>) => {
      const notification: AppNotification = {
        ...action.payload,
        type: 'warning',
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },

    // Convenience action for showing info messages
    showInfo: (state, action: PayloadAction<{ title: string; message: string; duration?: number }>) => {
      const notification: AppNotification = {
        ...action.payload,
        type: 'info',
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },
  },
});

export const {
  setOnlineStatus,
  setInstallStatus,
  setCanInstall,
  setUpdateAvailable,
  setSyncStatus,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  clearModal,
  setGlobalLoading,
  setGlobalError,
  clearGlobalError,
  setDeviceType,
  setOrientation,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} = appSlice.actions;

export default appSlice.reducer;