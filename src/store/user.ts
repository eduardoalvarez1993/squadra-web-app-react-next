'use client';

import { create } from 'zustand';

interface Permissoes {
  gerenteFuncional:  boolean;
  perfilDP:          boolean;
  bateRep:           boolean;
  perfilCoordenador: boolean;
  perfilTI:          boolean;
  perfilMarketing:   boolean;
}

export interface SessionUser {
  gestorId:    number;
  pessoaId:    number;
  sqhorasId:   number;
  login:       string;
  nome:        string;
  cargo:       string;
  foto:        string | null;
  permissoes:  Permissoes;
  simulando:   boolean;
  podeSimular: boolean;
  temEquipe:   boolean;
}

interface UserStore extends SessionUser {
  // UI state
  drawerOpen:       boolean;
  activeTab:        string;
  fluenciaOpen:     boolean;
  sidebarCollapsed: boolean;

  // Actions
  setUser:            (data: SessionUser) => void;
  clearUser:          () => void;
  setDrawer:          (open: boolean) => void;
  setTab:             (tab: string) => void;
  setFluencia:        (open: boolean) => void;
  toggleSidebar:      () => void;
}

const initialState: Omit<UserStore, 'setUser' | 'clearUser' | 'setDrawer' | 'setTab' | 'setFluencia' | 'toggleSidebar'> = {
  gestorId:    0,
  pessoaId:    0,
  sqhorasId:   0,
  login:       '',
  nome:        '',
  cargo:       '',
  foto:        null,
  permissoes: {
    gerenteFuncional:  false,
    perfilDP:          false,
    bateRep:           false,
    perfilCoordenador: false,
    perfilTI:          false,
    perfilMarketing:   false,
  },
  simulando:   false,
  podeSimular: false,
  temEquipe:   false,
  drawerOpen:       false,
  activeTab:        '',
  fluenciaOpen:     false,
  sidebarCollapsed: false,
};

export const useUserStore = create<UserStore>((set) => ({
  ...initialState,

  setUser: (data) =>
    set({
      ...data,
      // bateRep is sourced from permissoes.bateRep — stored flat on the store for convenience
      permissoes: {
        gerenteFuncional:  data.permissoes.gerenteFuncional,
        perfilDP:          data.permissoes.perfilDP,
        bateRep:           data.permissoes.bateRep,
        perfilCoordenador: data.permissoes.perfilCoordenador,
        perfilTI:          data.permissoes.perfilTI,
        perfilMarketing:   data.permissoes.perfilMarketing,
      },
    }),

  clearUser: () => set(initialState),

  setDrawer:     (open) => set({ drawerOpen: open }),
  setTab:        (tab)  => set({ activeTab: tab }),
  setFluencia:   (open) => set({ fluenciaOpen: open }),
  toggleSidebar: ()     => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
