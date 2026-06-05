import { describe, it, expect, beforeEach } from "vitest";

describe("useUIStore", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("debe iniciar sidebarOpen en true cuando la pantalla es escritorio", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { useUIStore } = await import("../store/useUIStore");

    const state = useUIStore.getState();

    expect(state.sidebarOpen).toBe(true);
    expect(state.isMobile).toBe(false);
  });

  it("debe iniciar sidebarOpen en false cuando la pantalla es móvil", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { useUIStore } = await import("../store/useUIStore");

    const state = useUIStore.getState();

    expect(state.sidebarOpen).toBe(false);
    expect(state.isMobile).toBe(true);
  });

  it("debe alternar sidebarOpen con toggleSidebar", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { useUIStore } = await import("../store/useUIStore");

    expect(useUIStore.getState().sidebarOpen).toBe(true);

    useUIStore.getState().toggleSidebar();

    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().toggleSidebar();

    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("debe cambiar sidebarOpen con setSidebarOpen", async () => {
    const { useUIStore } = await import("../store/useUIStore");

    useUIStore.getState().setSidebarOpen(false);

    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().setSidebarOpen(true);

    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("debe cambiar isMobile con setIsMobile", async () => {
    const { useUIStore } = await import("../store/useUIStore");

    useUIStore.getState().setIsMobile(true);

    expect(useUIStore.getState().isMobile).toBe(true);

    useUIStore.getState().setIsMobile(false);

    expect(useUIStore.getState().isMobile).toBe(false);
  });

  it("debe guardar el texto de búsqueda con setSearch", async () => {
    const { useUIStore } = await import("../store/useUIStore");

    useUIStore.getState().setSearch("Ambato");

    expect(useUIStore.getState().search).toBe("Ambato");
  });
});
