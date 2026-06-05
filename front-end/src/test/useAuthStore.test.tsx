import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../services", () => ({
  authService: {
    logout: vi.fn(),
    clearSession: vi.fn(),
  },
}));

const mockSession = {
  access_token: "token-test",
  user: {
    id: 1,
    nombre: "Juan Pérez",
    email: "juan@test.com",
    role: "admin",
  },
};

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
};

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    const localStorageMock = createLocalStorageMock();

    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  it("debe iniciar con session en null", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");

    expect(useAuthStore.getState().session).toBeNull();
  });

  it("debe guardar la sesión con setSession", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");

    useAuthStore.getState().setSession(mockSession);

    expect(useAuthStore.getState().session).toEqual(mockSession);
  });

  it("debe limpiar la sesión cuando setSession recibe null", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");

    useAuthStore.getState().setSession(mockSession);
    expect(useAuthStore.getState().session).toEqual(mockSession);

    useAuthStore.getState().setSession(null);
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("debe cerrar sesión correctamente", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");
    const { authService } = await import("../services");

    vi.mocked(authService.logout).mockResolvedValueOnce(undefined);

    useAuthStore.getState().setSession(mockSession);

    await useAuthStore.getState().logout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("debe limpiar la sesión aunque authService.logout falle", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");
    const { authService } = await import("../services");

    vi.mocked(authService.logout).mockRejectedValueOnce(
      new Error("Error logout"),
    );

    useAuthStore.getState().setSession(mockSession);

    await expect(useAuthStore.getState().logout()).rejects.toThrow(
      "Error logout",
    );

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().session).toBeNull();
  });
});
