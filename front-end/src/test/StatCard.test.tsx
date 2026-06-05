import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import { StatCard } from "../components/common/StatCard";

describe("StatCard", () => {
  test("debe mostrar la etiqueta recibida por props", () => {
    render(
      <StatCard
        label="Usuarios"
        value="25"
        detail="Usuarios registrados"
      />
    );

    expect(screen.getByText("Usuarios")).toBeInTheDocument();
  });

  test("debe mostrar el valor principal recibido por props", () => {
    render(
      <StatCard
        label="Proyectos"
        value="10"
        detail="Proyectos activos"
      />
    );

    expect(screen.getByText("10")).toBeInTheDocument();
  });

  test("debe mostrar el detalle recibido por props", () => {
    render(
      <StatCard
        label="Tareas"
        value="40"
        detail="Tareas pendientes"
      />
    );

    expect(screen.getByText("Tareas pendientes")).toBeInTheDocument();
  });

  test("debe renderizar el contenedor con las clases actuales", () => {
    render(
      <StatCard
        label="Reportes"
        value="8"
        detail="Reportes generados"
      />
    );

    const label = screen.getByText("Reportes");
    const container = label.closest("article");

    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("card-uride");
    expect(container).toHaveClass("p-5");
    expect(container).toHaveClass("transition-all");
  });

  test("debe mostrar el indicador de carga cuando value es puntos suspensivos", () => {
    render(
      <StatCard
        label="Cargando"
        value="..."
        detail="Consultando datos"
      />
    );

    expect(screen.getByText("Cargando")).toBeInTheDocument();
    expect(screen.getByText("Consultando datos")).toBeInTheDocument();

    const label = screen.getByText("Cargando");
    const container = label.closest("article");

    expect(container).toBeInTheDocument();
    expect(container?.querySelector("svg")).toBeInTheDocument();
  });

  test("debe renderizar icono personalizado cuando se envía por props", () => {
    render(
      <StatCard
        label="Usuarios"
        value="25"
        detail="Usuarios registrados"
        icon={Users}
      />
    );

    const label = screen.getByText("Usuarios");
    const container = label.closest("article");

    expect(container).toBeInTheDocument();
    expect(container?.querySelector("svg")).toBeInTheDocument();
  });

  test("debe renderizar tendencia positiva", () => {
    render(
      <StatCard
        label="Crecimiento"
        value="15"
        detail="Usuarios nuevos"
        trend={{
          value: "+10%",
          positive: true,
        }}
      />
    );

    const trend = screen.getByText("+10%");

    expect(trend).toBeInTheDocument();
    expect(trend).toHaveClass("text-uride-600");
  });

  test("debe renderizar tendencia negativa", () => {
    render(
      <StatCard
        label="Reportes"
        value="5"
        detail="Reportes pendientes"
        trend={{
          value: "-5%",
          positive: false,
        }}
      />
    );

    const trend = screen.getByText("-5%");

    expect(trend).toBeInTheDocument();
    expect(trend).toHaveClass("text-red-600");
  });

  test("debe renderizar barra de progreso", () => {
    render(
      <StatCard
        label="Avance"
        value="70"
        detail="Progreso del módulo"
        progress={70}
      />
    );

    const label = screen.getByText("Avance");
    const container = label.closest("article");

    const progressBar = container?.querySelector(
      ".bg-linear-to-r"
    ) as HTMLElement;

    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: "70%" });
  });
});