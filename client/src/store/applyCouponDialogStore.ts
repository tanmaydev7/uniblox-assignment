import { create } from 'zustand';

interface ApplyCouponDialogStore {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useApplyCouponDialogStore = create<ApplyCouponDialogStore>()((set) => ({
  isOpen: false,
  openDialog: () => set({ isOpen: true }),
  closeDialog: () => set({ isOpen: false }),
}));

