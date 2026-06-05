import { beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "../services/authService";
import { requestJson } from "../services/api";

vi.mock("../services/api", () => ({
  requestJson: vi.fn(),
}));

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

const mockSession = {
  access_token: "token-test",
  user: {
    id: 1,
    nombre: "Juan Pérez",
    correo_institucional: "juan@uta.edu.ec",
    role: "admin",
  },
};

describe("authService", () => {
  beforeEach(() => {
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

  it("debe iniciar sesión llamando a /auth/login con método POST", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce(mockSession);

    const credentials = {
      correo_institucional: "juan@uta.edu.ec",
      password: "123456",
    };

    const result = await authService.login(credentials);

    expect(requestJson).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    expect(result).toEqual(mockSession);
  });

  it("debe registrar un usuario llamando a /auth/register con método POST", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Usuario registrado correctamente",
    });

    const registerData = {
      correo_institucional: "nuevo@uta.edu.ec",
      password: "123456",
      nombre: "Nuevo Usuario",
      carrera: "Software",
      zona_barrio: "Ambato",
      telefono: "0999999999",
    };

    const result = await authService.register(registerData);

    expect(requestJson).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: JSON.stringify(registerData),
    });

    expect(result).toEqual({
      message: "Usuario registrado correctamente",
    });
  });

  it("debe solicitar recuperación de contraseña", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Token generado",
      devResetToken: "reset-token-test",
    });

    const result = await authService.forgotPassword("user@uta.edu.ec");

    expect(requestJson).toHaveBeenCalledWith("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        correo_institucional: "user@uta.edu.ec",
      }),
    });

    expect(result).toEqual({
      message: "Token generado",
      devResetToken: "reset-token-test",
    });
  });

  it("debe restablecer la contraseña con token", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Contraseña actualizada",
    });

    const data = {
      token: "reset-token-test",
      newPassword: "nuevaPassword123",
    };

    const result = await authService.resetPassword(data);

    expect(requestJson).toHaveBeenCalledWith("/auth/reset-password", {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    expect(result).toEqual({
      message: "Contraseña actualizada",
    });
  });

  it("debe cambiar la contraseña del usuario autenticado", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Contraseña cambiada",
    });

    const data = {
      currentPassword: "actual123",
      newPassword: "nueva123",
    };

    const result = await authService.changePassword(data);

    expect(requestJson).toHaveBeenCalledWith("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    expect(result).toEqual({
      message: "Contraseña cambiada",
    });
  });

  it("debe cerrar sesión llamando a /auth/logout con método POST", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce(undefined);

    await authService.logout();

    expect(requestJson).toHaveBeenCalledWith("/auth/logout", {
      method: "POST",
    });
  });

  it("debe ignorar errores al cerrar sesión", async () => {
    vi.mocked(requestJson).mockRejectedValueOnce(
      new Error("Error del servidor"),
    );

    await expect(authService.logout()).resolves.toBeUndefined();

    expect(requestJson).toHaveBeenCalledWith("/auth/logout", {
      method: "POST",
    });
  });

  it("debe guardar la sesión en localStorage", () => {
    authService.saveSession(mockSession);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "uride-session",
      JSON.stringify(mockSession),
    );
  });

  it("debe obtener la sesión guardada desde localStorage", () => {
    localStorage.setItem("uride-session", JSON.stringify(mockSession));

    const result = authService.getSession();

    expect(result).toEqual(mockSession);
  });

  it("debe retornar null si no existe sesión guardada", () => {
    const result = authService.getSession();

    expect(result).toBeNull();
  });

  it("debe eliminar la sesión corrupta y retornar null", () => {
    localStorage.setItem("uride-session", "{json inválido");

    const result = authService.getSession();

    expect(result).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith("uride-session");
  });

  it("debe limpiar la sesión del localStorage", () => {
    localStorage.setItem("uride-session", JSON.stringify(mockSession));

    authService.clearSession();

    expect(localStorage.removeItem).toHaveBeenCalledWith("uride-session");
  });
});
