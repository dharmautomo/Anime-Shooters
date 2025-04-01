import { create } from 'zustand';

interface GameControlsState {
  isControlsLocked: boolean;
  hasInteracted: boolean;
  
  // Actions
  setControlsLocked: (locked: boolean) => void;
  setHasInteracted: (interacted: boolean) => void;
}

export const useGameControls = create<GameControlsState>((set) => ({
  isControlsLocked: false,
  hasInteracted: false,
  
  setControlsLocked: (locked) => set({ isControlsLocked: locked }),
  setHasInteracted: (interacted) => set({ hasInteracted: interacted }),
}));