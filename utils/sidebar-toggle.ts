let toggleSidebarRef: (() => void) | null = null;

export const sidebarToggle = {
  register: (toggleFn: () => void) => {
    toggleSidebarRef = toggleFn;
  },
  unregister: () => {
    toggleSidebarRef = null;
  },
  toggle: () => {
    if (toggleSidebarRef) {
      toggleSidebarRef();
    } else {
      console.warn("Sidebar toggle not registered. Make sure SidebarProvider is mounted.");
    }
  },
};