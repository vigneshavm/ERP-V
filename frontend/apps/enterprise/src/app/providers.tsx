'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { QueryProvider } from '@repo/shared';

import { store } from '@/app/store/store';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';




export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryProvider>
        <ThemeProvider>
          {children}
          <ToastContainer 
            position="top-right" 
            autoClose={3000} 
            hideProgressBar={false} 
            newestOnTop={false} 
            closeOnClick 
            rtl={false} 
            pauseOnFocusLoss 
            draggable 
            pauseOnHover 
            theme="colored" 
          />
        </ThemeProvider>
      </QueryProvider>

    </Provider>
  );
}

