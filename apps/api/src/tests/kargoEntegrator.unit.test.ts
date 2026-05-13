import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  splitFullName,
  createShipment,
  getShipment,
  deleteShipment,
  checkConnection,
  KargoEntegratorError,
  type OrderForShipment,
} from "../services/kargoEntegrator";

describe("splitFullName", () => {
  it("splits two-word name correctly", () => {
    expect(splitFullName("Ahmet Yılmaz")).toEqual({ name: "Ahmet", surname: "Yılmaz" });
  });

  it("splits three-word name — last word is surname", () => {
    expect(splitFullName("Ahmet Mehmet Yılmaz")).toEqual({
      name: "Ahmet Mehmet",
      surname: "Yılmaz",
    });
  });

  it("handles single word — duplicates as both", () => {
    expect(splitFullName("Ahmet")).toEqual({ name: "Ahmet", surname: "Ahmet" });
  });

  it("trims extra spaces", () => {
    expect(splitFullName("  Fatma  Şahin  ")).toEqual({
      name: "Fatma",
      surname: "Şahin",
    });
  });
});

const MOCK_ORDER: OrderForShipment = {
  id: 42,
  totalAmount: "150.00",
  shippingAddressJson: {
    fullName: "Zeynep Kara",
    phone: "05550000000",
    line1: "Örnek Mah. No:1",
    district: "Kadıköy",
    city: "İstanbul",
    postalCode: "34710",
  },
  items: [
    { quantity: 2, titleSnapshot: "Test Ürün" },
  ],
  user: { email: "zeynep@example.com" },
};

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  });
}

describe("createShipment", () => {
  beforeEach(() => {
    process.env.KARGO_ENTEGRATOR_API_KEY = "test-key";
    process.env.KARGO_ENTEGRATOR_BASE_URL = "https://fake-ke.test";
    process.env.KARGO_ENTEGRATOR_WAREHOUSE_ID = "2";
    process.env.KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID = "1";
    process.env.KARGO_ENTEGRATOR_DEFAULT_DESI = "3";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/shipments and returns response", async () => {
    const fetchSpy = mockFetch(200, { id: 99, barcode: "123456789", status: "NEW" });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createShipment(MOCK_ORDER);

    expect(result.id).toBe(99);
    expect(result.barcode).toBe("123456789");

    const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://fake-ke.test/api/shipments");
    expect(opts.method).toBe("POST");

    const body = JSON.parse(opts.body as string);
    expect(body.customer.name).toBe("Zeynep");
    expect(body.customer.surname).toBe("Kara");
    expect(body.customer.email).toBe("zeynep@example.com");
    expect(body.customer.city).toBe("İstanbul");
    expect(body.total).toBe(150);
    expect(body.platform_d_id).toBe(42);
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0].quantity).toBe(2);
  });

  it("throws KargoEntegratorError on 4xx response", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(422, { message: "Validation failed" })
    );

    await expect(createShipment(MOCK_ORDER)).rejects.toThrow(KargoEntegratorError);
  });
});

describe("getShipment", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("calls GET /api/shipments/{id}", async () => {
    const fetchSpy = mockFetch(200, { id: 5, status: "SHIPPED" });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await getShipment(5);
    expect(result.status).toBe("SHIPPED");

    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("/api/shipments/5");
  });
});

describe("deleteShipment", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("calls DELETE /api/shipments/{id}", async () => {
    const fetchSpy = mockFetch(204, null);
    vi.stubGlobal("fetch", fetchSpy);

    await expect(deleteShipment(7)).resolves.toBeUndefined();

    const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/shipments/7");
    expect(opts.method).toBe("DELETE");
  });
});

describe("checkConnection", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("returns true on 200", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { ok: true }));
    expect(await checkConnection()).toBe(true);
  });

  it("returns false on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    expect(await checkConnection()).toBe(false);
  });
});
