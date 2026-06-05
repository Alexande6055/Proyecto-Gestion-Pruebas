import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportsService } from "../services/reportsService";
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

describe("reportsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe obtener todos los reportes", async () => {
    const reports = [
      { id: 1, motivo: "Reporte 1" },
      { id: 2, motivo: "Reporte 2" },
    ];

    vi.mocked(entityService.getAll).mockResolvedValueOnce(reports);

    const result = await reportsService.getAll();

    expect(entityService.getAll).toHaveBeenCalledWith("/reports");
    expect(result).toEqual(reports);
  });

  it("debe obtener un reporte por ID", async () => {
    const report = {
      id: 10,
      motivo: "Conducta inadecuada",
    };

    vi.mocked(entityService.getById).mockResolvedValueOnce(report);

    const result = await reportsService.getById(10);

    expect(entityService.getById).toHaveBeenCalledWith("/reports", 10);
    expect(result).toEqual(report);
  });

  it("debe crear un reporte", async () => {
    const data = {
      reportado_id: 5,
      motivo: "No llegó al punto de encuentro",
    };

    vi.mocked(entityService.create).mockResolvedValueOnce(undefined);

    await reportsService.create(data);

    expect(entityService.create).toHaveBeenCalledWith("/reports", data);
  });

  it("debe actualizar un reporte", async () => {
    const data = {
      motivo: "Motivo actualizado",
    };

    vi.mocked(entityService.update).mockResolvedValueOnce(undefined);

    await reportsService.update(7, data);

    expect(entityService.update).toHaveBeenCalledWith("/reports", 7, data);
  });

  it("debe gestionar un reporte aceptándolo", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce(undefined);

    await reportsService.manage(3, "aceptar", "Usuario sancionado");

    expect(requestJson).toHaveBeenCalledWith("/reports/3/manage", {
      method: "PATCH",
      body: JSON.stringify({
        decision: "aceptar",
        actionTaken: "Usuario sancionado",
      }),
    });
  });

  it("debe gestionar un reporte rechazándolo sin acción tomada", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce(undefined);

    await reportsService.manage("abc-123", "rechazar");

    expect(requestJson).toHaveBeenCalledWith("/reports/abc-123/manage", {
      method: "PATCH",
      body: JSON.stringify({
        decision: "rechazar",
        actionTaken: undefined,
      }),
    });
  });

  it("debe eliminar un reporte", async () => {
    vi.mocked(entityService.delete).mockResolvedValueOnce(undefined);

    await reportsService.delete(12);

    expect(entityService.delete).toHaveBeenCalledWith("/reports", 12);
  });
});
