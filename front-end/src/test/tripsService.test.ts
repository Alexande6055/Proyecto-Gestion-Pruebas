import { beforeEach, describe, expect, it, vi } from "vitest";
import { tripsService } from "../services/tripsService";
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

describe("tripsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe obtener todos los viajes", async () => {
    const trips = [
      { id: 1, origen_zona: "Ambato", destino_zona: "UTA" },
      { id: 2, origen_zona: "Izamba", destino_zona: "FISEI" },
    ];

    vi.mocked(entityService.getAll).mockResolvedValueOnce(trips);

    const result = await tripsService.getAll();

    expect(entityService.getAll).toHaveBeenCalledWith("/trips");
    expect(result).toEqual(trips);
  });

  it("debe obtener un viaje por ID", async () => {
    const trip = {
      id: 10,
      origen_zona: "Huachi",
      destino_zona: "UTA",
    };

    vi.mocked(entityService.getById).mockResolvedValueOnce(trip);

    const result = await tripsService.getById(10);

    expect(entityService.getById).toHaveBeenCalledWith("/trips", 10);
    expect(result).toEqual(trip);
  });

  it("debe crear un viaje", async () => {
    const data = {
      origen_zona: "Ambato Centro",
      destino_zona: "UTA",
      cupos_disponibles: 3,
      costo: 1.5,
    };

    vi.mocked(entityService.create).mockResolvedValueOnce(undefined);

    await tripsService.create(data);

    expect(entityService.create).toHaveBeenCalledWith("/trips", data);
  });

  it("debe actualizar un viaje", async () => {
    const data = {
      cupos_disponibles: 2,
      costo: 2,
    };

    vi.mocked(entityService.update).mockResolvedValueOnce(undefined);

    await tripsService.update(15, data);

    expect(entityService.update).toHaveBeenCalledWith("/trips", 15, data);
  });

  it("debe iniciar un viaje", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Viaje iniciado",
    });

    const result = await tripsService.start(7);

    expect(requestJson).toHaveBeenCalledWith("/trips/7/start", {
      method: "POST",
    });

    expect(result).toEqual({
      message: "Viaje iniciado",
    });
  });

  it("debe finalizar un viaje", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Viaje finalizado",
    });

    const result = await tripsService.complete(8);

    expect(requestJson).toHaveBeenCalledWith("/trips/8/complete", {
      method: "POST",
    });

    expect(result).toEqual({
      message: "Viaje finalizado",
    });
  });

  it("debe iniciar un viaje con ID tipo string", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Viaje iniciado",
    });

    const result = await tripsService.start("abc-123");

    expect(requestJson).toHaveBeenCalledWith("/trips/abc-123/start", {
      method: "POST",
    });

    expect(result).toEqual({
      message: "Viaje iniciado",
    });
  });

  it("debe finalizar un viaje con ID tipo string", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      message: "Viaje finalizado",
    });

    const result = await tripsService.complete("trip-999");

    expect(requestJson).toHaveBeenCalledWith("/trips/trip-999/complete", {
      method: "POST",
    });

    expect(result).toEqual({
      message: "Viaje finalizado",
    });
  });

  it("debe eliminar un viaje", async () => {
    vi.mocked(entityService.delete).mockResolvedValueOnce(undefined);

    await tripsService.delete(20);

    expect(entityService.delete).toHaveBeenCalledWith("/trips", 20);
  });
});
