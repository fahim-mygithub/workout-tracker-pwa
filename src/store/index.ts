import { configureStore } from '@reduxjs/toolkit';
import workoutReducer from './slices/workoutSlice';
import exerciseReducer from './slices/exerciseSlice';
import userReducer from './slices/userSlice';
import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    workout: workoutReducer,
    exercise: exerciseReducer,
    user: userReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;