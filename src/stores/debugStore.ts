import { create } from 'zustand'

interface DebugStore {
  isEnabled: boolean
  isLoading: boolean
  logs: string[]
  responseLog: string | null
  enable: () => void
  disable: () => void
  setLoading: (loading: boolean) => void
  log: (message: string, data?: any) => void
  setResponse: (response: string | null) => void
  clear: () => void
}

const safeStringify = (data: any): string => {
  try {
    return JSON.stringify(data, (key, value) => {
      // Handle circular references and DOM elements
      if (value instanceof Window || value instanceof Document || value instanceof Event) {
        return '[Circular]';
      }
      return value;
    });
  } catch (error) {
    return '[Unable to stringify data]';
  }
};

export const useDebugStore = create<DebugStore>((set) => ({
  isEnabled: typeof window !== 'undefined' 
    ? localStorage.getItem('debugMode') === 'true'
    : false,
  isLoading: false,
  logs: [],
  responseLog: null,

  enable: () => set({ isEnabled: true }),
  disable: () => set({ isEnabled: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  log: (message: string, data?: any) => set((state) => ({
    logs: [...state.logs, 
      data ? `[INFO] ${message} ${safeStringify(data)}` : `[INFO] ${message}`
    ]
  })),

  setResponse: (response) => set({ responseLog: response }),
  clear: () => set({ logs: [], responseLog: null })
})) 