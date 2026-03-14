/**
 * Standard event names for inter-MFE communication.
 */
export enum EventType {
  AUTH_UPDATED = 'AUTH_UPDATED',
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED',
  THEME_CHANGED = 'THEME_CHANGED',
  TENANT_CHANGED = 'TENANT_CHANGED',
}

/**
 * Payload definitions for each event type.
 */
export interface EventPayloads {
  [EventType.AUTH_UPDATED]: {
    isAuthenticated: boolean;
    user: any | null;
    token: string | null;
  };
  [EventType.NOTIFICATION_RECEIVED]: {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
  };
  [EventType.THEME_CHANGED]: {
    theme: 'light' | 'dark' | 'system';
  };
  [EventType.TENANT_CHANGED]: {
    tenantId: string;
  };
}
