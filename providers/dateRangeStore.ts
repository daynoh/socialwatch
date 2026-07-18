import { create } from 'zustand'


interface DateStoreState {
    startDate : Date
    endDate : Date
}

interface DateStoreActions{
    setStartDate: (date: Date) => void
    setEndDate: (date: Date) => void
}
// Adjustments in the useDateStore definition
export const useDateStore = create<DateStoreState & DateStoreActions>((set) => ({
    // Initialize startDate and endDate with actual Date objects
    startDate: new Date(2023,0.1),
    endDate: new Date(),

    setStartDate: (date) => set(() => ({ startDate: date })),
    setEndDate: (date) => set(() => ({ endDate: date })),
}));
