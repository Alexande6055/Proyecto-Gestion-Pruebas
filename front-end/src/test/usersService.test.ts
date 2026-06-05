import { beforeEach, describe, expect, it, vi } from "vitest";
import { usersService } from "../services/usersService";
import { entityService } from "../services/entityService";
import { requestJson } from "../services/api";

vi.mock("../services/entityService", () => ({
  entityService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  requestJson: vi.fn(),
}));

describe("usersService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe obtener todos los usuarios", async () => {
    const users = [
      { id: 1, nombre: "Ana Torres" },
      { id: 2, nombre: "Luis Pérez" },
    ];

    vi.mocked(entityService.getAll).mockResolvedValueOnce(users);

    const result = await usersService.getAll();

    expect(entityService.getAll).toHaveBeenCalledWith("/users");
    expect(result).toEqual(users);
  });

  it("debe obtener el perfil del usuario autenticado", async () => {
    const profile = {
      id: 1,
      nombre: "Ana Torres",
      correo_institucional: "ana@uta.edu.ec",
    };

    vi.mocked(requestJson).mockResolvedValueOnce(profile);

    const result = await usersService.getProfile();

    expect(requestJson).toHaveBeenCalledWith("/users/profile");
    expect(result).toEqual(profile);
  });

  it("debe obtener un usuario por ID", async () => {
    const user = {
      id: 10,
      nombre: "Carlos López",
    };

    vi.mocked(entityService.getById).mockResolvedValueOnce(user);

    const result = await usersService.getById(10);

    expect(entityService.getById).toHaveBeenCalledWith("/users", 10);
    expect(result).toEqual(user);
  });

  it("debe crear un usuario", async () => {
    const data = {
      nombre: "Nuevo Usuario",
      correo_institucional: "nuevo@uta.edu.ec",
      carrera: "Software",
    };

    vi.mocked(entityService.create).mockResolvedValueOnce(undefined);

    await usersService.create(data);

    expect(entityService.create).toHaveBeenCalledWith("/users", data);
  });

  it("debe actualizar un usuario", async () => {
    const data = {
      nombre: "Usuario Actualizado",
      telefono: "0999999999",
    };

    vi.mocked(entityService.update).mockResolvedValueOnce(undefined);

    await usersService.update(15, data);

    expect(entityService.update).toHaveBeenCalledWith("/users", 15, data);
  });

  it("debe restablecer la contraseña de un usuario", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Contraseña restablecida",
    });

    const result = await usersService.resetPassword(5, "NuevaPassword123");

    expect(requestJson).toHaveBeenCalledWith("/users/5/reset-password", {
      method: "PATCH",
      body: JSON.stringify({
        newPassword: "NuevaPassword123",
      }),
    });

    expect(result).toEqual({
      message: "Contraseña restablecida",
    });
  });

  it("debe restablecer la contraseña usando ID string", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Contraseña restablecida",
    });

    const result = await usersService.resetPassword(
      "user-abc",
      "ClaveNueva123",
    );

    expect(requestJson).toHaveBeenCalledWith("/users/user-abc/reset-password", {
      method: "PATCH",
      body: JSON.stringify({
        newPassword: "ClaveNueva123",
      }),
    });

    expect(result).toEqual({
      message: "Contraseña restablecida",
    });
  });

  it("debe eliminar un usuario", async () => {
    vi.mocked(entityService.delete).mockResolvedValueOnce(undefined);

    await usersService.delete(20);

    expect(entityService.delete).toHaveBeenCalledWith("/users", 20);
  });
});
