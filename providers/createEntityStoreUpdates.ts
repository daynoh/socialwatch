import { create } from 'zustand';

interface AverageTweet {
  date: Date;
  averageSentiment: number;
}

interface Entity {
  id: string;
  entityName: string;
  positiveRetweets: number;
  negativeRetweets: number;
  positiveLikes: number;
  negativeLikes: number;
  averageTweets: AverageTweet[]; // Adding averageTweets here
  tweetsTotal :number 
}

interface EntityStoreState {
  entities: Record<string, Entity>;
}

interface EntityStoreActions {
  addEntity: (id: string, name: string) => void;
  removeEntity: (id: string) => void;
  updateEntityName: (id: string, name: string) => void;
  updatePositiveRetweets: (id: string, value: number) => void;
  updateNegativeRetweets: (id: string, value: number) => void;
  updatePositiveLikes: (id: string, value: number) => void;
  updateNegativeLikes: (id: string, value: number) => void;
  addAverageTweet: (id: string, date: Date, averageSentiment: number) => void;
  updateAverageTweet: (id: string, date: Date, averageSentiment: number) => void;
  removeAverageTweet: (id: string, date: Date) => void;
  updateTweetTotal:(id:string,tweetsTotal:number) => void;
}


function createEntityStoreUpdates() {
  return create<EntityStoreState & EntityStoreActions>((set) => ({
    entities: {},

    addEntity: (id, name) => set((state) => ({
      entities: {
        ...state.entities,
        [id]: { id, entityName: name, averageTweets: [],positiveRetweets: 0, negativeRetweets: 0, positiveLikes: 0, negativeLikes: 0 ,tweetsTotal:0},
      },
    })),

    removeEntity: (id) => set((state) => {
      const newState = { ...state.entities };
      delete newState[id];
      return { entities: newState };
    }),
    
    updateEntityName: (id, name) => set((state) => ({
      entities: {
        ...state.entities,
        [id]: { ...state.entities[id], entityName: name },
      },
    })),

    updatePositiveRetweets: (id, value) => set((state) => ({
      entities: {
        ...state.entities,
        [id]: { ...state.entities[id], positiveRetweets: value },
      },
    })),

    updateNegativeRetweets: (id, value) => set((state) => ({
      entities: {
        ...state.entities,
        [id]: { ...state.entities[id], negativeRetweets: value },
      },
    })),

    updatePositiveLikes: (id, value) => set((state) => ({
      entities: {
        ...state.entities,
        [id]: { ...state.entities[id], positiveLikes: value },
      },
    })),

    updateNegativeLikes: (id, value) => set((state) => ({
      entities: {
        ...state.entities,
        [id]: { ...state.entities[id], negativeLikes: value },
      },
    })),

    addAverageTweet: (id, date, averageSentiment) => set((state) => ({
        entities: {
          ...state.entities,
          [id]: {
            ...state.entities[id],
            averageTweets: [...state.entities[id].averageTweets, { date, averageSentiment }],
          },
        },
      })),
  
      updateAverageTweet: (id, date, averageSentiment) => set((state) => ({
        entities: {
          ...state.entities,
          [id]: {
            ...state.entities[id],
            averageTweets: state.entities[id].averageTweets.map((tweet) =>
              tweet.date === date ? { ...tweet, averageSentiment } : tweet
            ),
          },
        },
      })),
  
      removeAverageTweet: (id, date) => set((state) => ({
        entities: {
          ...state.entities,
          [id]: {
            ...state.entities[id],
            averageTweets: state.entities[id].averageTweets.filter((tweet) => tweet.date !== date),
          },
        },
      })),
     
      updateTweetTotal: (id, value)=> set((state) => ({
        entities: {
          ...state.entities,
          [id]: {
            ...state.entities[id], tweetsTotal: value
          }
        }
      }))
  }));
}

export default createEntityStoreUpdates;
