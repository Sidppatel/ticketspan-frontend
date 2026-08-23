import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const GLOBAL_EVENT_CATEGORIES = [
  'Live Concerts',
  'Festivals',
  'Sports & Tournaments',
  'Theatre & Performing Arts',
  'Conferences & Summits',
  'Dining & Nightlife',
  'Comedy & Shows',
  'Art & Exhibitions',
  'Community & Meetups',
  'Workshops & Masterclasses',
  'Charity & Galas',
  'Club & DJ Nights',
] as const;

export type EventCategory = (typeof GLOBAL_EVENT_CATEGORIES)[number];

export type SeatingPreference = 'any' | 'aisle' | 'center' | 'front_row' | 'vip_box' | 'quiet_zone';

export interface AttendeePreferences {
  interests: string[];
  seatingPreference: SeatingPreference;
  accessibilityRequired: boolean;
  accessibilityNotes: string;
  smsGatePasses: boolean;
  emailReceipts: boolean;
  dropAlerts: boolean;
  weeklyDigest: boolean;
  preferredCity: string;
  dietaryNotes: string;
  pronouns: string;
  bio: string;
}

interface ProfilePreferencesState extends AttendeePreferences {
  toggleInterest: (interest: string) => void;
  setInterests: (interests: string[]) => void;
  setSeatingPreference: (pref: SeatingPreference) => void;
  setAccessibilityRequired: (required: boolean) => void;
  setAccessibilityNotes: (notes: string) => void;
  setSmsGatePasses: (enabled: boolean) => void;
  setEmailReceipts: (enabled: boolean) => void;
  setDropAlerts: (enabled: boolean) => void;
  setWeeklyDigest: (enabled: boolean) => void;
  setPreferredCity: (city: string) => void;
  setDietaryNotes: (notes: string) => void;
  setPronouns: (pronouns: string) => void;
  setBio: (bio: string) => void;
  updatePreferences: (partial: Partial<AttendeePreferences>) => void;
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES: AttendeePreferences = {
  interests: ['Live Concerts', 'Festivals', 'Dining & Nightlife'],
  seatingPreference: 'any',
  accessibilityRequired: false,
  accessibilityNotes: '',
  smsGatePasses: true,
  emailReceipts: true,
  dropAlerts: true,
  weeklyDigest: false,
  preferredCity: '',
  dietaryNotes: '',
  pronouns: '',
  bio: '',
};

export const useProfilePreferencesStore = create<ProfilePreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      toggleInterest: (interest) =>
        set((state) => {
          const exists = state.interests.includes(interest);
          return {
            interests: exists
              ? state.interests.filter((i) => i !== interest)
              : [...state.interests, interest],
          };
        }),
      setInterests: (interests) => set({ interests }),
      setSeatingPreference: (seatingPreference) => set({ seatingPreference }),
      setAccessibilityRequired: (accessibilityRequired) => set({ accessibilityRequired }),
      setAccessibilityNotes: (accessibilityNotes) => set({ accessibilityNotes }),
      setSmsGatePasses: (smsGatePasses) => set({ smsGatePasses }),
      setEmailReceipts: (emailReceipts) => set({ emailReceipts }),
      setDropAlerts: (dropAlerts) => set({ dropAlerts }),
      setWeeklyDigest: (weeklyDigest) => set({ weeklyDigest }),
      setPreferredCity: (preferredCity) => set({ preferredCity }),
      setDietaryNotes: (dietaryNotes) => set({ dietaryNotes }),
      setPronouns: (pronouns) => set({ pronouns }),
      setBio: (bio) => set({ bio }),
      updatePreferences: (partial) => set((state) => ({ ...state, ...partial })),
      resetPreferences: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: 'ticketspan_attendee_preferences',
    },
  ),
);
