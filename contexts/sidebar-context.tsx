// contexts/sidebar-context.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { sidebarToggle } from "@/utils/sidebar-toggle";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
};

// Create the context with a default undefined value for better TypeScript support
const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);

// Custom hook to use sidebar context
export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

// Hook specifically for toggling sidebar from anywhere
export function useToggleSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useToggleSidebar must be used within a SidebarProvider.");
  }
  return context.toggleSidebar;
}

// Hook to get sidebar state
export function useSidebarState() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarState must be used within a SidebarProvider.");
  }
  return {
    state: context.state,
    open: context.open,
    openMobile: context.openMobile,
  };
}

interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// export function SidebarProvider({
//   defaultOpen = true,
//   open: openProp,
//   onOpenChange: setOpenProp,
//   className,
//   style,
//   children,
//   ...props
// }: SidebarProviderProps) {
//   const [openMobile, setOpenMobile] = React.useState(false);

//   // Internal state for uncontrolled usage
//   const [_open, _setOpen] = React.useState(defaultOpen);
//   const open = openProp ?? _open;

//   // Set open function with callback support
//   const setOpen = React.useCallback(
//     (value: boolean | ((value: boolean) => boolean)) => {
//       const openState = typeof value === "function" ? value(open) : value;
//       if (setOpenProp) {
//         setOpenProp(openState);
//       } else {
//         _setOpen(openState);
//       }

//       // Optional: Save to cookie or localStorage for persistence
//       // document.cookie = `sidebar-state=${openState}; path=/; max-age=31536000`;
//       // localStorage.setItem('sidebar-state', openState.toString());
//     },
//     [setOpenProp, open]
//   );

//   // Toggle sidebar function
//   const toggleSidebar = React.useCallback(() => {
//     setOpen((open) => !open);
//   }, [setOpen]);

//   // State for styling
//   const state = open ? "expanded" : "collapsed";

//   // Memoized context value
//   const contextValue = React.useMemo<SidebarContextProps>(
//     () => ({
//       state,
//       open,
//       setOpen,
//       openMobile,
//       setOpenMobile,
//       toggleSidebar,
//     }),
//     [state, open, setOpen, openMobile, setOpenMobile, toggleSidebar]
//   );

//   return (
//     <SidebarContext.Provider value={contextValue}>
//       <div
//         data-slot="sidebar-wrapper"
//         style={style}
//         className={cn(
//           "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
//           className
//         )}
//         {...props}
//       >
//         {children}
//       </div>
//     </SidebarContext.Provider>
//   );
// }
// Enhanced SidebarProvider with global registration
export function SidebarProvider({
  defaultOpen = false,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
    },
    [setOpenProp, open]
  );

  const toggleSidebar = React.useCallback(() => {
    setOpen((open) => !open);
  }, [setOpen]);

  const state = open ? "expanded" : "collapsed";

  // Register the toggle function globally on mount
  React.useEffect(() => {
    sidebarToggle.register(toggleSidebar);
    return () => {
      sidebarToggle.unregister();
    };
  }, [toggleSidebar]);

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, setOpenMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={style}
        className={cn(
          // "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// Export the context for direct access (advanced usage)
export { SidebarContext };

export default {
  SidebarProvider,
  useSidebar,
  useToggleSidebar,
  useSidebarState,
};