import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DbStore, DbAddress, DbAurangabadLocation } from '@/lib/supabase-types';

interface SelectedLocation {
  name: string;
  lat: number;
  lng: number;
  pincode?: string;
  type?: string;
}

interface LocationState {
  currentAddress: DbAddress | null;
  savedAddresses: DbAddress[];
  nearestStore: DbStore | null;
  selectedLocation: SelectedLocation | null;
  isLocationLoading: boolean;
  locationError: string | null;
  hasCompletedLocationSelection: boolean;
  
  // Actions
  setCurrentAddress: (address: DbAddress) => void;
  addAddress: (address: DbAddress) => void;
  updateAddress: (id: string, address: Partial<DbAddress>) => void;
  removeAddress: (id: string) => void;
  setNearestStore: (store: DbStore) => void;
  setSelectedLocation: (location: SelectedLocation) => void;
  setLocationLoading: (loading: boolean) => void;
  setLocationError: (error: string | null) => void;
  setHasCompletedLocationSelection: (completed: boolean) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      currentAddress: null,
      savedAddresses: [],
      nearestStore: null,
      selectedLocation: null,
      isLocationLoading: false,
      locationError: null,
      hasCompletedLocationSelection: false,

      setCurrentAddress: (address: DbAddress) => {
        set({ currentAddress: address, locationError: null });
      },

      addAddress: (address: DbAddress) => {
        set((state) => ({
          savedAddresses: [...state.savedAddresses, address],
        }));
      },

      updateAddress: (id: string, updates: Partial<DbAddress>) => {
        set((state) => ({
          savedAddresses: state.savedAddresses.map((addr) =>
            addr.id === id ? { ...addr, ...updates } : addr
          ),
        }));
      },

      removeAddress: (id: string) => {
        set((state) => ({
          savedAddresses: state.savedAddresses.filter((addr) => addr.id !== id),
        }));
      },

      setNearestStore: (store: DbStore) => {
        set({ nearestStore: store });
      },

      setSelectedLocation: (location: SelectedLocation) => {
        set({ 
          selectedLocation: location, 
          locationError: null,
          hasCompletedLocationSelection: true 
        });
      },

      setLocationLoading: (loading: boolean) => {
        set({ isLocationLoading: loading });
      },

      setLocationError: (error: string | null) => {
        set({ locationError: error });
      },

      setHasCompletedLocationSelection: (completed: boolean) => {
        set({ hasCompletedLocationSelection: completed });
      },

      clearLocation: () => {
        set({
          currentAddress: null,
          selectedLocation: null,
          nearestStore: null,
          hasCompletedLocationSelection: false,
        });
      },
    }),
    {
      name: 'sweeftcom-location',
    }
  )
);
