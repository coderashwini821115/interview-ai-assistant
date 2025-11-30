// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import candidateReducer from './feature/candidateSlice';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
  candidate: candidateReducer,
});

const persistConfig = {
  key: 'root',
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);
