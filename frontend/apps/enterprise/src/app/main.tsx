import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/app/store/store';
import App from './App';
import './styles/index.css';
import { ThemeProvider } from '@/app/providers/ThemeContext';

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-dsn-here@sentry.io/your-project", // Placeholder - user should provide actual DSN
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Global error handlers for errors escaping the React tree
window.onerror = (message, source, lineno, colno, error) => {
  Sentry.captureException(error || new Error(String(message)), {
    tags: { level: 'window.onerror' },
    extra: { source, lineno, colno },
  });
};

window.onunhandledrejection = (event) => {
  Sentry.captureException(event.reason, {
    tags: { level: 'unhandledrejection' },
  });
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import { BrowserRouter } from 'react-router-dom';
// ...
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
