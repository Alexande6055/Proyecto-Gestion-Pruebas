import { beforeEach, describe, expect, it, vi } from "vitest";
import { payphoneService } from "../services/payphoneService";

describe("payphoneService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    document.head.innerHTML = "";
    document.body.innerHTML = "";

    const renderMock = vi.fn();

    function PPaymentButtonBoxMock(this: any, config: any) {
      this.config = config;
      this.render = renderMock;
    }

    Object.defineProperty(window, "PPaymentButtonBox", {
      value: vi.fn(PPaymentButtonBoxMock),
      writable: true,
      configurable: true,
    });
  });

  it("debe cargar los assets de Payphone cuando no existe el script", async () => {
    const promise = payphoneService.loadAssets();

    const script = document.querySelector(
      'script[src*="payphone-payment-box.js"]',
    ) as HTMLScriptElement;

    const link = document.querySelector(
      'link[href*="payphone-payment-box.css"]',
    ) as HTMLLinkElement;

    expect(link).not.toBeNull();
    expect(link.rel).toBe("stylesheet");
    expect(script).not.toBeNull();
    expect(script.type).toBe("module");

    script.onload?.(new Event("load"));

    await expect(promise).resolves.toBeUndefined();
  });

  it("no debe volver a cargar assets si el script ya existe", async () => {
    const existingScript = document.createElement("script");

    existingScript.src =
      "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js";

    document.body.appendChild(existingScript);

    await payphoneService.loadAssets();

    const scripts = document.querySelectorAll(
      'script[src*="payphone-payment-box.js"]',
    );

    expect(scripts).toHaveLength(1);
  });

  it("debe rechazar si falla la carga del script", async () => {
    const promise = payphoneService.loadAssets();

    const script = document.querySelector(
      'script[src*="payphone-payment-box.js"]',
    ) as HTMLScriptElement;

    script.onerror?.(new Event("error"));

    await expect(promise).rejects.toThrow("No se pudo cargar Payphone SDK");
  });

  it("debe renderizar el botón de pago en el contenedor indicado", async () => {
    const container = document.createElement("div");
    container.id = "payphone-container";
    container.innerHTML = "<p>contenido anterior</p>";
    document.body.appendChild(container);

    const promise = payphoneService.renderButton("payphone-container", {
      amount: 500,
      amountWithoutTax: 400,
      amountWithTax: 446,
      tax: 54,
      service: 0,
      tip: 0,
      clientTransactionId: "TX-001",
      reference: "Pago de prueba",
    });

    const script = document.querySelector(
      'script[src*="payphone-payment-box.js"]',
    ) as HTMLScriptElement;

    script.onload?.(new Event("load"));

    await promise;

    expect(container.innerHTML).toBe("");
    expect(window.PPaymentButtonBox).toHaveBeenCalledTimes(1);

    expect(window.PPaymentButtonBox).toHaveBeenCalledWith(
      expect.objectContaining({
        clientTransactionId: "TX-001",
        amount: 500,
        amountWithoutTax: 400,
        amountWithTax: 446,
        tax: 54,
        service: 0,
        tip: 0,
        currency: "USD",
        reference: "Pago de prueba",
        lang: "es",
        defaultMethod: "card",
        timeZone: -5,
      }),
    );

    const instance = vi.mocked(window.PPaymentButtonBox).mock.instances[0];

    expect(instance.render).toHaveBeenCalledWith("payphone-container");
  });

  it("debe usar valores por defecto cuando no se envían campos opcionales", async () => {
    const container = document.createElement("div");
    container.id = "payphone-container";
    document.body.appendChild(container);

    const promise = payphoneService.renderButton("payphone-container", {
      amount: 1000,
      clientTransactionId: "TX-002",
    });

    const script = document.querySelector(
      'script[src*="payphone-payment-box.js"]',
    ) as HTMLScriptElement;

    script.onload?.(new Event("load"));

    await promise;

    expect(window.PPaymentButtonBox).toHaveBeenCalledWith(
      expect.objectContaining({
        clientTransactionId: "TX-002",
        amount: 1000,
        amountWithoutTax: 0,
        amountWithTax: 0,
        tax: 0,
        service: 0,
        tip: 0,
        reference: "Pago Ecommerce",
      }),
    );

    const instance = vi.mocked(window.PPaymentButtonBox).mock.instances[0];

    expect(instance.render).toHaveBeenCalledWith("payphone-container");
  });

  it("debe lanzar error si el contenedor no existe", async () => {
    const promise = payphoneService.renderButton("no-existe", {
      amount: 500,
      clientTransactionId: "TX-003",
    });

    const script = document.querySelector(
      'script[src*="payphone-payment-box.js"]',
    ) as HTMLScriptElement;

    script.onload?.(new Event("load"));

    await expect(promise).rejects.toThrow("Contenedor no encontrado");
  });
});
