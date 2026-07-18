import { create } from 'zustand';

interface EntityStoreState {
  entityName: string;
  positiveRetweets: number;
  negativeRetweets: number;
  positiveLikes: number;
  negativeLikes: number;
}

interface EntityStoreActions {
  setEntityName: (name: string) => void;
  updatePositiveRetweets: (value: number) => void;
  updateNegativeRetweets: (value: number) => void;
  updatePositiveLikes: (value: number) => void;
  updateNegativeLikes: (value: number) => void;
}

// Factory function to create a store for a specific entity
function createEntityStore() {
  return create<EntityStoreState & EntityStoreActions>((set) => ({
    entityName: '',
    positiveRetweets: 0,
    negativeRetweets: 0,
    positiveLikes: 0,
    negativeLikes: 0,

    setEntityName: (name) => set(() => ({ entityName: name })),
    updatePositiveRetweets: (value) => set((state) => ({ positiveRetweets: value })),
    updateNegativeRetweets: (value) => set((state) => ({ negativeRetweets: value })),
    updatePositiveLikes: (value) => set((state) => ({ positiveLikes: value })),
    updateNegativeLikes: (value) => set((state) => ({ negativeLikes: value })),
  }));
}

export default createEntityStore;
