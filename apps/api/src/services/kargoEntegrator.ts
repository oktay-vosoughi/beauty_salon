export class KargoEntegratorError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "KargoEntegratorError";
  }
}

function cfg() {
  const apiKey = process.env.KARGO_ENTEGRATOR_API_KEY ?? "";
  const baseUrl =
    process.env.KARGO_ENTEGRATOR_BASE_URL ?? "https://app.kargoentegrator.com";
  const warehouseId = parseInt(
    process.env.KARGO_ENTEGRATOR_WAREHOUSE_ID ?? "0",
    10
  );
  const cargoIntegrationId = parseInt(
    process.env.KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID ?? "0",
    10
  );
  const defaultDesi = parseInt(
    process.env.KARGO_ENTEGRATOR_DEFAULT_DESI ?? "3",
    10
  );
  return { apiKey, baseUrl, warehouseId, cargoIntegrationId, defaultDesi };
}

function headers() {
  return {
    Authorization: `Bearer ${cfg().apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function keRequest<T = unknown>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const { baseUrl } = cfg();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new KargoEntegratorError(
      res.status,
      `KE ${res.status} on ${method} ${path}: ${text.slice(0, 300)}`
    );
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export function splitFullName(fullName: string): {
  name: string;
  surname: string;
} {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: parts[0] };
  const surname = parts[parts.length - 1];
  const name = parts.slice(0, -1).join(" ");
  return { name, surname };
}

export interface OrderForShipment {
  id: number;
  totalAmount: string | number;
  shippingAddressJson: {
    fullName: string;
    phone: string;
    line1: string;
    district: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    quantity: number;
    titleSnapshot: string;
  }>;
  user: {
    email: string;
  };
}

export interface KeShipmentResponse {
  id: number;
  barcode?: string | null;
  tracking_number?: string | null;
  status?: string;
  [key: string]: unknown;
}

export async function createShipment(
  order: OrderForShipment,
  note?: string
): Promise<KeShipmentResponse> {
  const { warehouseId, cargoIntegrationId, defaultDesi } = cfg();
  const addr = order.shippingAddressJson as {
    fullName: string;
    phone: string;
    line1: string;
    district: string;
    city: string;
    postalCode: string;
  };
  const { name, surname } = splitFullName(addr.fullName);

  const body = {
    cargo_integration_id: cargoIntegrationId,
    warehouse_id: warehouseId,
    customer: {
      name,
      surname,
      phone: addr.phone,
      email: order.user.email,
      country: "TÜRKIYE",
      postcode: addr.postalCode,
      city: addr.city,
      district: addr.district,
      address: addr.line1,
    },
    payment_type: "credit_card",
    package_type: "box",
    payor_type: "sender",
    is_pay_at_door: false,
    total: Number(order.totalAmount),
    currency: "TRY",
    desi: defaultDesi,
    platform_d_id: order.id,
    note: note ?? "",
    lines: order.items.map((item) => ({
      quantity: item.quantity,
      sku: item.titleSnapshot,
    })),
  };

  return keRequest<KeShipmentResponse>("POST", "/api/shipments", body);
}

export async function getShipment(
  keShipmentId: number
): Promise<KeShipmentResponse> {
  return keRequest<KeShipmentResponse>("GET", `/api/shipments/${keShipmentId}`);
}

export async function deleteShipment(keShipmentId: number): Promise<void> {
  await keRequest("DELETE", `/api/shipments/${keShipmentId}`);
}

export async function printLabel(keShipmentId: number): Promise<Buffer> {
  const { baseUrl } = cfg();
  const res = await fetch(
    `${baseUrl}/api/print-pdf?shipments[]=${keShipmentId}`,
    { headers: headers() }
  );
  if (!res.ok) {
    throw new KargoEntegratorError(res.status, "Label download failed");
  }
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

export async function checkConnection(): Promise<boolean> {
  try {
    await keRequest("GET", "/api/helpers/check-connection");
    return true;
  } catch {
    return false;
  }
}
