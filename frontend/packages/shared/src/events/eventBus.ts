import { EventType, EventPayloads } from './eventTypes';

/**
 * Lightweight Event Bus using BroadcastChannel for Inter-MFE communication.
 * This works across same-domain tabs and windows, and within the same window.
 */
class EventBus {
  private static instance: EventBus;
  private channel: BroadcastChannel | null = null;
  private listeners: Map<EventType, Set<(payload: any) => void>> = new Map();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.channel = new BroadcastChannel('erp-mfe-bus');
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data;
        this.notify(type, payload);
      };
    }
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publishes an event to all subscribers (local and remote).
   */
  public publish<T extends EventType>(type: T, payload: EventPayloads[T]): void {
    // Notify local subscribers first
    this.notify(type, payload);

    // Broadcast to other contexts (tabs/windows)
    if (this.channel) {
      this.channel.postMessage({ type, payload });
    }
  }

  /**
   * Subscribes to an event and returns an unsubscribe function.
   */
  public subscribe<T extends EventType>(type: T, callback: (payload: EventPayloads[T]) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Internal helper to notify local listeners.
   */
  private notify(type: EventType, payload: any): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in EventBus subscriber for ${type}:`, error);
        }
      });
    }
  }
}

export const eventBus = EventBus.getInstance();
