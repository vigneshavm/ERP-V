import { Action, ThunkDispatch } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ThunkDispatch<RootState, any, Action>;
