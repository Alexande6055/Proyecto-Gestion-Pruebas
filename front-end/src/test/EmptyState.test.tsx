import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../components/common/EmptyState";
import { AlertTriangle } from "lucide-react";

describe("EmptyState", () => {
  test("debe mostrar el título recibido por props", () => {
    render(
      <EmptyState
        title="No hay registros"
        message="Todavía no existen datos registrados."
      />
    );

    expect(screen.getByText("No hay registros")).toBeInTheDocument();
  });

  test("debe mostrar el mensaje recibido por props", () => {
    render(
      <EmptyState
        title="Sin información"
        message="Agrega nuevos elementos para comenzar."
      />
    );

    expect(
      screen.getByText("Agrega nuevos elementos para comenzar.")
    ).toBeInTheDocument();
  });

  test("debe renderizar el contenedor con las clases actuales", () => {
    const { container } = render(
      <EmptyState
        title="No encontrado"
        message="No se encontraron resultados."
      />
    );

    const emptyStateContainer = container.firstElementChild;

    expect(emptyStateContainer).toBeInTheDocument();
    expect(emptyStateContainer).toHaveClass("flex");
    expect(emptyStateContainer).toHaveClass("flex-col");
    expect(emptyStateContainer).toHaveClass("items-center");
    expect(emptyStateContainer).toHaveClass("justify-center");
    expect(emptyStateContainer).toHaveClass("text-center");
  });

  test("debe renderizar el título con clases visuales actuales", () => {
    render(
      <EmptyState
        title="No encontrado"
        message="No se encontraron resultados."
      />
    );

    const title = screen.getByText("No encontrado");

    expect(title).toHaveClass("block");
    expect(title).toHaveClass("text-lg");
    expect(title).toHaveClass("font-bold");
    expect(title).toHaveClass("text-night-800");
  });

  test("debe renderizar el mensaje con clases visuales actuales", () => {
    render(
      <EmptyState
        title="Sin datos"
        message="No existen datos disponibles."
      />
    );

    const message = screen.getByText("No existen datos disponibles.");

    expect(message).toHaveClass("text-sm");
    expect(message).toHaveClass("text-night-500");
    expect(message).toHaveClass("max-w-xs");
    expect(message).toHaveClass("leading-relaxed");
  });

  test("debe mostrar una acción cuando se envía por props", () => {
    render(
      <EmptyState
        title="Sin registros"
        message="Agrega un nuevo elemento."
        action={<button type="button">Agregar</button>}
      />
    );

    expect(
      screen.getByRole("button", { name: /agregar/i })
    ).toBeInTheDocument();
  });

  test("debe permitir enviar un icono personalizado", () => {
    render(
      <EmptyState
        title="Advertencia"
        message="Existe una novedad."
        icon={AlertTriangle}
      />
    );

    expect(screen.getByText("Advertencia")).toBeInTheDocument();
    expect(screen.getByText("Existe una novedad.")).toBeInTheDocument();
  });
});