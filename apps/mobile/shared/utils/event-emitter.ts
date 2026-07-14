// Lightweight event emitter for cross-module communication (no external dependencies)
type Listener = () => void;

class AppEventEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener); // return unsubscribe function
  }

  off(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string) {
    this.listeners.get(event)?.forEach((fn) => fn());
  }
}

export const authEventEmitter = new AppEventEmitter();
