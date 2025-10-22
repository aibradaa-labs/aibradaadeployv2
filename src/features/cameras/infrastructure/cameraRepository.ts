import { Camera, CameraType, CameraBrand } from "@features/shared/domain/types";

export interface CameraRepository {
  getCameras(): Promise<Camera[]>;
  getCameraById(id: string): Promise<Camera | null>;
  searchCameras(query: string): Promise<Camera[]>;
  filterCameras(options: {
    type?: CameraType;
    brand?: CameraBrand;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Camera[]>;
}

export class ApiCameraRepository implements CameraRepository {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getCameras(): Promise<Camera[]> {
    const response = await fetch(`${this.apiBaseUrl}/cameras`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cameras: ${response.statusText}`);
    }
    return response.json();
  }

  async getCameraById(id: string): Promise<Camera | null> {
    const response = await fetch(`${this.apiBaseUrl}/cameras/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch camera: ${response.statusText}`);
    }
    return response.json();
  }

  async searchCameras(query: string): Promise<Camera[]> {
    const response = await fetch(
      `${this.apiBaseUrl}/cameras/search?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to search cameras: ${response.statusText}`);
    }
    return response.json();
  }

  async filterCameras(options: {
    type?: CameraType;
    brand?: CameraBrand;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Camera[]> {
    const params = new URLSearchParams();
    if (options.type) params.append("type", options.type);
    if (options.brand) params.append("brand", options.brand);
    if (options.minPrice) params.append("minPrice", options.minPrice.toString());
    if (options.maxPrice) params.append("maxPrice", options.maxPrice.toString());

    const response = await fetch(
      `${this.apiBaseUrl}/cameras/filter?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Failed to filter cameras: ${response.statusText}`);
    }
    return response.json();
  }
}

export class LocalCameraRepository implements CameraRepository {
  private cameras: Camera[] = [];

  constructor(initialData: Camera[] = []) {
    this.cameras = initialData;
  }

  async getCameras(): Promise<Camera[]> {
    return Promise.resolve(this.cameras);
  }

  async getCameraById(id: string): Promise<Camera | null> {
    const camera = this.cameras.find(c => c.id === id);
    return Promise.resolve(camera || null);
  }

  async searchCameras(query: string): Promise<Camera[]> {
    const terms = query.toLowerCase().split(" ");
    const filtered = this.cameras.filter(camera => {
      const searchText = `${camera.brand} ${camera.model} ${camera.type} ${camera.sensorSize}`.toLowerCase();
      return terms.every(term => searchText.includes(term));
    });
    return Promise.resolve(filtered);
  }

  async filterCameras(options: {
    type?: CameraType;
    brand?: CameraBrand;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Camera[]> {
    let filtered = [...this.cameras];

    if (options.type && options.type !== "All") {
      filtered = filtered.filter(c => c.type === options.type);
    }

    if (options.brand && options.brand !== "All") {
      filtered = filtered.filter(c => c.brand === options.brand);
    }

    if (options.minPrice !== undefined) {
      filtered = filtered.filter(c => c.price >= options.minPrice!);
    }

    if (options.maxPrice !== undefined) {
      filtered = filtered.filter(c => c.price <= options.maxPrice!);
    }

    return Promise.resolve(filtered);
  }
}