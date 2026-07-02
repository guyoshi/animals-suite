import { create } from 'zustand';

interface UiStore {
  immersive: boolean;
  setImmersive: (value: boolean) => void;
}

// Estado de interface efêmero (não persistido): usado pelo modo tela cheia dos
// editores de mapa para esconder a moldura do app e dar toda a área ao desenho.
export const useUiStore = create<UiStore>((set) => ({
  immersive: false,
  setImmersive: (value) => set({ immersive: value }),
}));
