/**
 * Payphone Payment Box Service
 */

interface PayphoneConfig {
  amount: number;
  amountWithoutTax?: number;
  amountWithTax?: number;
  tax?: number;
  service?: number;
  tip?: number;
  clientTransactionId: string;
  reference?: string;
}

declare global {
  interface Window {
    PPaymentButtonBox: any;
  }
}

export const payphoneService = {
  async loadAssets(): Promise<void> {
    const existingScript = document.querySelector(
      'script[src*="payphone-payment-box.js"]'
    );

    if (!existingScript) {
      await new Promise<void>((resolve, reject) => {
        // CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css";

        document.head.appendChild(link);

        // JS
        const script = document.createElement("script");
        script.src =
          "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js";
        script.type = "module";

        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("No se pudo cargar Payphone SDK"));

        document.body.appendChild(script);
      });
    }
  },

  async renderButton(
    containerId: string,
    config: PayphoneConfig
  ): Promise<void> {
    await this.loadAssets();

    const container = document.getElementById(containerId);

    if (!container) {
      throw new Error("Contenedor no encontrado");
    }

    container.innerHTML = "";

    const token = import.meta.env.VITE_TOKEN_PAYPHONE;
    const storeId = import.meta.env.VITE_STORE_ID;

    new window.PPaymentButtonBox({
      token,
      storeId,

      clientTransactionId: config.clientTransactionId,

      amount: config.amount,

      amountWithoutTax: config.amountWithoutTax || 0,
      amountWithTax: config.amountWithTax || 0,
      tax: config.tax || 0,
      service: config.service || 0,
      tip: config.tip || 0,

      currency: "USD",

      reference: config.reference || "Pago Ecommerce",

      lang: "es",

      // Opcional
      defaultMethod: "card",

      timeZone: -5,

      // IMPORTANTE:
      // Debe coincidir con tu dominio registrado
      // en Payphone Developer
    }).render(containerId);
  },
};