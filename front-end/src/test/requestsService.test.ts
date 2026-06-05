import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestsService } from "../services/requestsService";
import { entityService } from "../services/entityService";
import { requestJson } from "../services/api";

vi.mock("../services/entityService", () => ({
  entityService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  requestJson: vi.fn(),
}));

describe("requestsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe obtener todas las solicitudes", async () => {
    const requests = [
      { id: 1, estado: "pendiente" },
      { id: 2, estado: "aceptada" },
    ];

    vi.mocked(entityService.getAll).mockResolvedValueOnce(requests);

    const result = await requestsService.getAll();

    expect(entityService.getAll).toHaveBeenCalledWith("/requests");
    expect(result).toEqual(requests);
  });

  it("debe obtener una solicitud por ID", async () => {
    const request = {
      id: 10,
      estado: "pendiente",
      viaje_id: 5,
    };

    vi.mocked(entityService.getById).mockResolvedValueOnce(request);

    const result = await requestsService.getById(10);

    expect(entityService.getById).toHaveBeenCalledWith("/requests", 10);
    expect(result).toEqual(request);
  });

  it("debe crear una solicitud", async () => {
    const data = {
      viaje_id: 3,
      pasajero_id: 8,
    };

    vi.mocked(entityService.create).mockResolvedValueOnce(undefined);

    await requestsService.create(data);

    expect(entityService.create).toHaveBeenCalledWith("/requests", data);
  });

  it("debe aceptar una solicitud cambiando su estado", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Solicitud aceptada",
    });

    const data = {
      conductor_id: 1,
      estado: "aceptada" as const,
    };

    const result = await requestsService.updateStatus(5, data);

    expect(requestJson).toHaveBeenCalledWith("/requests/5/status", {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    expect(result).toEqual({
      message: "Solicitud aceptada",
    });
  });

  it("debe rechazar una solicitud cambiando su estado", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Solicitud rechazada",
    });

    const data = {
      conductor_id: 1,
      estado: "rechazada" as const,
    };

    const result = await requestsService.updateStatus("abc-123", data);

    expect(requestJson).toHaveBeenCalledWith("/requests/abc-123/status", {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    expect(result).toEqual({
      message: "Solicitud rechazada",
    });
  });

  it("debe cancelar una solicitud con motivo", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Solicitud cancelada",
    });

    const result = await requestsService.cancel(9, "Ya no necesito el viaje");

    expect(requestJson).toHaveBeenCalledWith("/requests/9/cancel", {
      method: "POST",
      body: JSON.stringify({
        reason: "Ya no necesito el viaje",
      }),
    });

    expect(result).toEqual({
      message: "Solicitud cancelada",
    });
  });

  it("debe eliminar una solicitud", async () => {
    vi.mocked(entityService.delete).mockResolvedValueOnce(undefined);

    await requestsService.delete(12);

    expect(entityService.delete).toHaveBeenCalledWith("/requests", 12);
  });
});
