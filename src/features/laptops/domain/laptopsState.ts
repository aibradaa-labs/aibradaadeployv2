import { SecurityError } from "../../../error-handling";

// Import and re-export core laptop types from shared domain
import { 
  Laptop,
  LaptopPlatform,
  LaptopBrand,
  LaptopSortOption
} from '../../shared/domain/types';

export type Platform = LaptopPlatform;
export type Brand = LaptopBrand;
export type SortOption = LaptopSortOption;
export type { Laptop };

// State types
export type AppState = {
  data: {
    allLaptops: Laptop[];
    sortedByRank: Laptop[];
    fallbackLaptops: Laptop[];
  };
  ui: {
    app: {
      price: number;
      platform: Platform;
      brand: Brand;
      sort: SortOption;
      radarSelection: string[];
    };
  };
};

// Operation result types
export type SuccessResult<T> = {
  success: true;
  data: T;
};

export type ErrorResult = {
  success: false;
  error: SecurityError | Error;
};

export type StateUpdateResult = SuccessResult<AppState> | ErrorResult;

type Listener = (state: AppState) => void;

// State Manager
export class LaptopsStateManager {
  private state: AppState;
  private listeners: Set<Listener>;

  constructor(initialState: AppState) {
    this.state = initialState;
    this.listeners = new Set();
  }

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  updateState(updater: (currentState: AppState) => StateUpdateResult): StateUpdateResult {
    try {
      const result = updater(this.state);
      if (result.success) {
        this.state = result.data;
        this.notify();
        return {
          success: true,
          data: this.state
        };
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  setState(newState: AppState): StateUpdateResult {
    return this.updateState(() => ({
      success: true,
      data: newState
    }));
  }
}
