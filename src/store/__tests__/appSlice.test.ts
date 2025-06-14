import { describe, it, expect } from 'vitest';
import appReducer, {
  setOnlineStatus,
  setInstallStatus,
  setCanInstall,
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
  showSuccess,
  showError,
  showWarning,
  showInfo,
  type AppNotification,
  type AppModal,
} from '../slices/appSlice';

describe('appSlice', () => {
  // Use a dynamic initial state that matches the actual slice implementation
  const getInitialState = () => {
    const mockInitialState = appReducer(undefined, { type: '@@INIT' });
    return {
      ...mockInitialState,
      // Override dynamic values with predictable ones for testing
      orientation: 'portrait' as const,
      deviceType: 'desktop' as const,
    };
  };

  it('should return the initial state', () => {
    const actualInitialState = appReducer(undefined, { type: 'unknown' });
    const expectedInitialState = getInitialState();
    
    expect(actualInitialState).toMatchObject({
      isOnline: expectedInitialState.isOnline,
      isInstalled: false,
      canInstall: false,
      updateAvailable: false,
      syncStatus: 'idle',
      notifications: [],
      activeModal: null,
      isLoading: false,
      globalError: null,
      lastSyncTime: null,
    });
  });

  describe('online status', () => {
    it('should set online status', () => {
      const initialState = getInitialState();
      const state = appReducer(initialState, setOnlineStatus(false));
      expect(state.isOnline).toBe(false);

      const state2 = appReducer(state, setOnlineStatus(true));
      expect(state2.isOnline).toBe(true);
    });
  });

  describe('install status', () => {
    it('should set install status', () => {
      const initialState = getInitialState();
      const state = appReducer(initialState, setInstallStatus(true));
      expect(state.isInstalled).toBe(true);
    });

    it('should set can install status', () => {
      const initialState = getInitialState();
      const state = appReducer(initialState, setCanInstall(true));
      expect(state.canInstall).toBe(true);
    });
  });

  describe('sync status', () => {
    it('should set sync status', () => {
      const initialState = getInitialState();
      const state = appReducer(initialState, setSyncStatus('syncing'));
      expect(state.syncStatus).toBe('syncing');
      expect(state.lastSyncTime).toBeNull();
    });

    it('should set last sync time when status is success', () => {
      const initialState = getInitialState();
      const state = appReducer(initialState, setSyncStatus('success'));
      expect(state.syncStatus).toBe('success');
      expect(state.lastSyncTime).toBeDefined();
      expect(new Date(state.lastSyncTime!).getTime()).toBeGreaterThan(
        Date.now() - 1000 // within last second
      );
    });
  });

  describe('notifications', () => {
    it('should add notification', () => {
      const initialState = getInitialState();
      const notification = {
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed',
        duration: 3000,
      };

      const state = appReducer(initialState, addNotification(notification));

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toMatchObject(notification);
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].timestamp).toBeDefined();
    });

    it('should remove notification by id', () => {
      const initialState = getInitialState();
      const stateWithNotification = {
        ...initialState,
        notifications: [{
          id: 'test-id',
          type: 'info' as const,
          title: 'Test',
          message: 'Test message',
          timestamp: new Date().toISOString(),
        }],
      };

      const state = appReducer(stateWithNotification, removeNotification('test-id'));
      expect(state.notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      const initialState = getInitialState();
      const stateWithNotifications = {
        ...initialState,
        notifications: [
          {
            id: '1',
            type: 'success' as const,
            title: 'Success',
            message: 'Test 1',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'error' as const,
            title: 'Error',
            message: 'Test 2',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const state = appReducer(stateWithNotifications, clearNotifications());
      expect(state.notifications).toHaveLength(0);
    });

    it('should show success notification', () => {
      const initialState = getInitialState();
      const payload = {
        title: 'Success',
        message: 'Operation completed successfully',
        duration: 5000,
      };

      const state = appReducer(initialState, showSuccess(payload));

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('success');
      expect(state.notifications[0].title).toBe('Success');
      expect(state.notifications[0].message).toBe('Operation completed successfully');
      expect(state.notifications[0].duration).toBe(5000);
    });

    it('should show error notification', () => {
      const initialState = getInitialState();
      const payload = {
        title: 'Error',
        message: 'Something went wrong',
      };

      const state = appReducer(initialState, showError(payload));

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('error');
      expect(state.notifications[0].title).toBe('Error');
    });

    it('should show warning notification', () => {
      const initialState = getInitialState();
      const payload = {
        title: 'Warning',
        message: 'Please check your connection',
      };

      const state = appReducer(initialState, showWarning(payload));

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('warning');
    });

    it('should show info notification', () => {
      const initialState = getInitialState();
      const payload = {
        title: 'Info',
        message: 'New feature available',
      };

      const state = appReducer(initialState, showInfo(payload));

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('info');
    });
  });

  describe('modals', () => {
    const mockModal: Omit<AppModal, 'isOpen'> = {
      id: 'test-modal',
      type: 'confirmation',
      props: { message: 'Are you sure?' },
    };

    it('should open modal', () => {
      const initialState = getInitialState();
      const state = appReducer(initialState, openModal(mockModal));

      expect(state.activeModal).toEqual({
        ...mockModal,
        isOpen: true,
      });
    });

    it('should close modal', () => {
      const initialState = getInitialState();
      const stateWithModal = {
        ...initialState,
        activeModal: {
          ...mockModal,
          isOpen: true,
        },
      };

      const state = appReducer(stateWithModal, closeModal());

      expect(state.activeModal?.isOpen).toBe(false);
    });

    it('should clear modal', () => {
      const initialState = getInitialState();
      const stateWithModal = {
        ...initialState,
        activeModal: {
          ...mockModal,
          isOpen: false,
        },
      };

      const state = appReducer(stateWithModal, clearModal());

      expect(state.activeModal).toBeNull();
    });
  });

  describe('global state', () => {
    it('should set global loading', () => {
      const initialState = getInitialState();
      const state = appReducer(initialState, setGlobalLoading(true));
      expect(state.isLoading).toBe(true);

      const state2 = appReducer(state, setGlobalLoading(false));
      expect(state2.isLoading).toBe(false);
    });

    it('should set global error', () => {
      const initialState = getInitialState();
      const state = appReducer(initialState, setGlobalError('Something went wrong'));
      expect(state.globalError).toBe('Something went wrong');
    });

    it('should clear global error', () => {
      const initialState = getInitialState();
      const stateWithError = {
        ...initialState,
        globalError: 'Some error',
      };

      const state = appReducer(stateWithError, clearGlobalError());
      expect(state.globalError).toBeNull();
    });
  });
});