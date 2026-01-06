import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Address, Store } from '@/types';

interface LocationState {
  currentAddress: Address | null;
  savedAddresses: Address[];
  nearestStore: Store | null;
  isLocationLoading: boolean;
  locationError: string | null;
  
  // Actions
  setCurrentAddress: (address: Address) => void;
  addAddress: (address: Address) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setNearestStore: (store: Store) => void;
  setLocationLoading: (loading: boolean) => void;
  setLocationError: (error: string | null) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      currentAddress: null,
      savedAddresses: [],
      nearestStore: null,
      isLocationLoading: false,
      locationError: null,

      setCurrentAddress: (address: Address) => {
        set({ currentAddress: address, locationError: null });
      },

      addAddress: (address: Address) => {
        set((state) => ({
          savedAddresses: [...state.savedAddresses, address],
        }));
      },

      updateAddress: (id: string, updates: Partial<Address>) => {
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

      setNearestStore: (store: Store) => {
        set({ nearestStore: store });
      },

      setLocationLoading: (loading: boolean) => {
        set({ isLocationLoading: loading });
      },

      setLocationError: (error: string | null) => {
        set({ locationError: error });
      },
    }),
    {
      name: 'blinkit-location',
    }
  )
);
