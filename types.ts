export interface CameraSettings {
  azimuth: number; // -180 to 180
  elevation: number; // -90 to 90
  zoom: number; // 0.5 to 3.0
  fov: number; // 10 to 120 degrees
  aspectRatio: string;
  count: number;
  description?: string; // Natural language description for the perspective
  imageSize: '1K' | '2K' | '4K'; // Pro model features
}

export interface CameraPose {
  id: string;
  name: string;
  settings: CameraSettings;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  NEEDS_KEY = 'NEEDS_KEY'
}

export interface GeneratedImage {
  url: string;
  settings: CameraSettings;
  timestamp: number;
}