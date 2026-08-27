import { create } from 'zustand';
import { getPublicAppSettings } from '@/shared/services/appSettingsService';

export interface AppSettingsState {
  bookingHoldSeconds: number;
  defaultTimezone: string;
  eventImageAspectRatio: string;
  eventThumbnailAspectRatio: string;
  sponsorImageAspectRatio: string;
  performerImageAspectRatio: string;
  venueImageAspectRatio: string;
  floorplanDefaultSize: number;
  floorplanCanvasWidth: number;
  floorplanCanvasHeight: number;
  floorplanDefaultColor: string;
  allSettings: Record<string, string>;
  isLoaded: boolean;
  isLoading: boolean;

  fetchSettings: () => Promise<void>;
  getSetting: (key: string, fallback?: string) => string;
  getIntSetting: (key: string, fallback?: number) => number;
}

let fetchPromise: Promise<void> | null = null;

export const useAppSettingsStore = create<AppSettingsState>()((set, get) => ({
  bookingHoldSeconds: 600,
  defaultTimezone: 'America/Chicago',
  eventImageAspectRatio: '16:9',
  eventThumbnailAspectRatio: '4:3',
  sponsorImageAspectRatio: '1:1',
  performerImageAspectRatio: '1:1',
  venueImageAspectRatio: '16:9',
  floorplanDefaultSize: 80,
  floorplanCanvasWidth: 1200,
  floorplanCanvasHeight: 800,
  floorplanDefaultColor: '#059669',
  allSettings: {},
  isLoaded: false,
  isLoading: false,

  fetchSettings: async () => {
    if (get().isLoaded) return;
    if (fetchPromise) return fetchPromise;

    set({ isLoading: true });
    fetchPromise = (async () => {
      try {
        const data = await getPublicAppSettings();
        const rawMap = data.allSettings || {};
        set({
          bookingHoldSeconds: data.bookingHoldSeconds || (rawMap['booking_hold_seconds'] ? parseInt(rawMap['booking_hold_seconds'], 10) : 600),
          defaultTimezone: data.defaultTimezone || rawMap['default_timezone'] || 'America/Chicago',
          eventImageAspectRatio: data.eventImageAspectRatio || rawMap['event_image_aspect_ratio'] || '16:9',
          eventThumbnailAspectRatio: data.eventThumbnailAspectRatio || rawMap['event_thumbnail_aspect_ratio'] || '4:3',
          sponsorImageAspectRatio: data.sponsorImageAspectRatio || rawMap['sponsor_image_aspect_ratio'] || '1:1',
          performerImageAspectRatio: data.performerImageAspectRatio || rawMap['performer_image_aspect_ratio'] || '1:1',
          venueImageAspectRatio: data.venueImageAspectRatio || rawMap['venue_image_aspect_ratio'] || '16:9',
          floorplanDefaultSize: data.floorplanDefaultSize || (rawMap['floorplan_default_size'] ? parseInt(rawMap['floorplan_default_size'], 10) : 80),
          floorplanCanvasWidth: data.floorplanCanvasWidth || (rawMap['floorplan_canvas_width'] ? parseInt(rawMap['floorplan_canvas_width'], 10) : 1200),
          floorplanCanvasHeight: data.floorplanCanvasHeight || (rawMap['floorplan_canvas_height'] ? parseInt(rawMap['floorplan_canvas_height'], 10) : 800),
          floorplanDefaultColor: data.floorplanDefaultColor || rawMap['floorplan_default_color'] || '#059669',
          allSettings: rawMap,
          isLoaded: true,
          isLoading: false,
        });
      } catch (err) {
        console.warn('Failed to load public app settings from database:', err);
        set({ isLoading: false });
      } finally {
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  },

  getSetting: (key: string, fallback = ''): string => {
    return get().allSettings[key] || fallback;
  },

  getIntSetting: (key: string, fallback = 0): number => {
    const raw = get().allSettings[key];
    if (!raw) return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  },
}));

if (typeof window !== 'undefined') {
  useAppSettingsStore.getState().fetchSettings().catch(() => {});
}
