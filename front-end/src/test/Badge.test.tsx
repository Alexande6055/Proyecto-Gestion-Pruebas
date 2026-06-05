import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, LoadingBadge } from "../components/common/Badge";

describe("Badge", () => {
  test("debe mostrar el texto recibido como children", () => {
    render(<Badge>Activo</Badge>);

    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  test("debe usar el tono neutral por defecto", () => {
    render(<Badge>Neutral</Badge>);

    const badge = screen.getByText("Neutral");

    expect(badge).toHaveClass("inline-flex");
    expect(badge).toHaveClass("bg-night-100");
    expect(badge).toHaveClass("text-night-700");
    expect(badge).toHaveClass("border-night-200");
  });

  test("debe aplicar el tono ok cuando se envía por props", () => {
    render(<Badge tone="ok">Completado</Badge>);

    const badge = screen.getByText("Completado");

    expect(badge).toHaveClass("bg-uride-100");
    expect(badge).toHaveClass("text-uride-800");
    expect(badge).toHaveClass("border-uride-200");
  });

  test("debe aplicar el tono warning cuando se envía por props", () => {
    render(<Badge tone="warning">Pendiente</Badge>);

    const badge = screen.getByText("Pendiente");

    expect(badge).toHaveClass("bg-amber-100");
    expect(badge).toHaveClass("text-amber-800");
    expect(badge).toHaveClass("border-amber-200");
  });

  test("debe aplicar el tono danger cuando se envía por props", () => {
    render(<Badge tone="danger">Cancelado</Badge>);

    const badge = screen.getByText("Cancelado");

    expect(badge).toHaveClass("bg-red-100");
    expect(badge).toHaveClass("text-red-800");
    expect(badge).toHaveClass("border-red-200");
  });

  test("debe aplicar el tono info cuando se envía por props", () => {
    render(<Badge tone="info">Información</Badge>);

    const badge = screen.getByText("Información");

    expect(badge).toHaveClass("bg-info-100");
    expect(badge).toHaveClass("text-info-800");
    expect(badge).toHaveClass("border-info-200");
  });

  test("debe aplicar el tono success cuando se envía por props", () => {
    render(<Badge tone="success">Exitoso</Badge>);

    const badge = screen.getByText("Exitoso");

    expect(badge).toHaveClass("bg-uride-100");
    expect(badge).toHaveClass("text-uride-800");
    expect(badge).toHaveClass("border-uride-200");
  });

  test("debe aplicar el tono primary cuando se envía por props", () => {
    render(<Badge tone="primary">Principal</Badge>);

    const badge = screen.getByText("Principal");

    expect(badge).toHaveClass("bg-uride-100");
    expect(badge).toHaveClass("text-uride-800");
    expect(badge).toHaveClass("border-uride-200");
  });

  test("debe aceptar clases adicionales mediante className", () => {
    render(<Badge className="mi-clase-extra">Personalizado</Badge>);

    const badge = screen.getByText("Personalizado");

    expect(badge).toHaveClass("mi-clase-extra");
  });

  test("debe aplicar tamaño pequeño cuando size es sm", () => {
    render(<Badge size="sm">Pequeño</Badge>);

    const badge = screen.getByText("Pequeño");

    expect(badge).toHaveClass("px-2.5");
    expect(badge).toHaveClass("py-0.5");
    expect(badge).toHaveClass("text-[10px]");
  });

  test("debe renderizar LoadingBadge correctamente", () => {
    render(<LoadingBadge>Cargando</LoadingBadge>);

    const badge = screen.getByText("Cargando");

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-night-100");
    expect(badge).toHaveClass("text-night-600");
    expect(badge).toHaveClass("border-night-200");
  });
});