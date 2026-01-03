import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FinanceState, Transaction, Cheque } from '../types/finance';
import { TransactionType } from '../types/common';
import { loadState, saveState } from './storage';

const initialFinanceState: FinanceState = {
  transactions: [],
  cheques: [],
  dailyFinanceRecords: [],
  bankBalance: 250000,
};

const financeSlice = createSlice({
  name: 'finance',
  initialState: loadState('finance', initialFinanceState),
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      if (action.payload.type === 'INCOME') {
        state.bankBalance += action.payload.amount;
      } else {
        state.bankBalance -= action.payload.amount;
      }
      saveState('finance', state);
    },
    addCheque: (state, action: PayloadAction<Cheque>) => {
      state.cheques.push(action.payload);
      saveState('finance', state);
    },
    updateChequeStatus: (state, action: PayloadAction<{ id: string, status: 'CLEARED' | 'BOUNCED' }>) => {
      const cheque = state.cheques.find(c => c.id === action.payload.id);
      if (cheque && cheque.status === 'PENDING') {
        cheque.status = action.payload.status;

        // If cleared, adjust balance
        if (action.payload.status === 'CLEARED') {
          if (cheque.type === 'RECEIVED') {
            state.bankBalance += cheque.amount;
            state.transactions.unshift({
              id: Math.random().toString(36).substr(2, 9),
              type: TransactionType.INCOME,
              category: 'Cheque Cleared',
              amount: cheque.amount,
              date: new Date().toISOString(),
              description: `Cheque Received: ${cheque.number}`,
              sector: cheque.sector,
              branchId: 'Alpha' // Default
            });
          } else {
            state.bankBalance -= cheque.amount;
            state.transactions.unshift({
              id: Math.random().toString(36).substr(2, 9),
              type: TransactionType.EXPENSE,
              category: 'Cheque Cleared',
              amount: cheque.amount,
              date: new Date().toISOString(),
              description: `Cheque Issued: ${cheque.number}`,
              sector: cheque.sector,
              branchId: 'Alpha' // Default
            });
          }
        }
      }
      saveState('finance', state);
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
    setCheques: (state, action: PayloadAction<Cheque[]>) => {
      state.cheques = action.payload;
    },
    setDailyRecords: (state, action: PayloadAction<any[]>) => {
      state.dailyFinanceRecords = action.payload;
    },
    addDailyRecord: (state, action: PayloadAction<any>) => {
      state.dailyFinanceRecords.unshift(action.payload);
      saveState('finance', state);
    },
    updateDailyRecord: (state, action: PayloadAction<any>) => {
      const index = state.dailyFinanceRecords.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.dailyFinanceRecords[index] = action.payload;
        saveState('finance', state);
      }
    },
    deleteDailyRecord: (state, action: PayloadAction<string>) => {
      state.dailyFinanceRecords = state.dailyFinanceRecords.filter(r => r.id !== action.payload);
      saveState('finance', state);
    },
    setDailyRecordSynced: (state, action: PayloadAction<{ id: string, synced: boolean }>) => {
      const record = state.dailyFinanceRecords.find(r => r.id === action.payload.id);
      if (record) {
        record.synced = action.payload.synced;
        saveState('finance', state);
      }
    }
  },
});

export const {
  addTransaction,
  addCheque,
  updateChequeStatus,
  setTransactions,
  setCheques,
  setDailyRecords,
  addDailyRecord,
  updateDailyRecord,
  deleteDailyRecord,
  setDailyRecordSynced
} = financeSlice.actions;
export default financeSlice.reducer;
