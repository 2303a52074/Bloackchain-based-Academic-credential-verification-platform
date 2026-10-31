import { User } from '../types';
import { apiClient } from './api';

class AuthSessionStore {
  private currentUser: User | null = null;
  private listeners: (() => void)[] = [];
  private isLoaded = false;

  constructor() {
    this.init();
  }

  public async init(): Promise<void> {
    const token = apiClient.getToken();
    if (!token) {
      this.currentUser = null;
      this.isLoaded = true;
      this.notify();
      return;
    }

    try {
      const res = await apiClient.getMe();
      this.currentUser = res.user;
    } catch {
      // Invalid or expired token
      apiClient.logout();
      this.currentUser = null;
    } finally {
      this.isLoaded = true;
      this.notify();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
    this.notify();
  }

  public isAuthLoaded(): boolean {
    return this.isLoaded;
  }

  public signOut(): void {
    apiClient.logout();
    this.currentUser = null;
    this.notify();
  }
}

export const authStore = new AuthSessionStore();
