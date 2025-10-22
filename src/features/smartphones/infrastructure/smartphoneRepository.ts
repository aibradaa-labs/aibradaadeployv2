import { Smartphone } from "@features/shared/domain/types";

export interface SmartphoneRepository {
  getSmartphones: () => Promise<Smartphone[]>;
  getSmartphoneById: (id: string) => Promise<Smartphone>;
  addSmartphone: (smartphone: Smartphone) => Promise<void>;
  updateSmartphone: (id: string, smartphone: Smartphone) => Promise<void>;
  deleteSmartphone: (id: string) => Promise<void>;
}

export class ApiSmartphoneRepository implements SmartphoneRepository {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async getSmartphones(): Promise<Smartphone[]> {
    try {
      const response = await fetch(`${this.apiUrl}/smartphones`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch smartphones: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getSmartphoneById(id: string): Promise<Smartphone> {
    try {
      const response = await fetch(`${this.apiUrl}/smartphones/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch smartphone: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addSmartphone(smartphone: Smartphone): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/smartphones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smartphone),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to add smartphone: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateSmartphone(id: string, smartphone: Smartphone): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/smartphones/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smartphone),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to update smartphone: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteSmartphone(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/smartphones/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete smartphone: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}