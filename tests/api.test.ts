import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import search from "./fixtures/search.json";
import info from "./fixtures/info.json";
import equipment from "./fixtures/equipment.json";
import { GET as searchGET } from "@/app/api/search/route";
import { GET as characterGET } from "@/app/api/character/route";

function mockFetch(handler: (url: string) => { status: number; body: unknown }) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      calls.push(url);
      const { status, body } = handler(url);
      return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
    }),
  );
  return calls;
}

const req = (path: string) => new NextRequest(new URL(path, "http://localhost"));

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/search", () => {
  it("valida parámetros", async () => {
    expect((await searchGET(req("/api/search?name=a&region=naw"))).status).toBe(400);
    expect((await searchGET(req("/api/search?name=Nyerk&region=xx"))).status).toBe(400);
  });

  it("consulta PLAYNC y normaliza", async () => {
    const calls = mockFetch(() => ({ status: 200, body: search }));
    const res = await searchGET(req("/api/search?name=Nyerk&region=naw"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0]).toMatchObject({ name: "Nyerk", serverId: "2201" });
    expect(calls[0]).toContain("api-search.plaync.com/aion2global/search/v2/character?keyword=Nyerk&region=naw");
  });

  it("traduce 403 a upstream_blocked", async () => {
    mockFetch(() => ({ status: 403, body: "forbidden" }));
    const res = await searchGET(req("/api/search?name=Nyerk&region=naw"));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("upstream_blocked");
  });
});

describe("GET /api/character", () => {
  const url = "/api/character?region=naw&serverId=2201&characterId=abc%253D";

  it("junta info + equipo y no doble-codifica el id", async () => {
    const calls = mockFetch((u) => ({ status: 200, body: u.includes("/equipment") ? equipment : info }));
    const res = await characterGET(req(url));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.snapshot).toMatchObject({ name: "Nyerk", itemLevel: 2400, combatPower: 152300, characterId: "abc=" });
    expect(body.snapshot.equipment).toHaveLength(3);
    expect(body.officialUrl).toBe("https://aion2.plaync.com/en-us/characters/2201/abc%3D?region=naw");
    for (const c of calls) {
      expect(c).toContain("characterId=abc%3D&");
      expect(c).not.toContain("%253D");
    }
  });

  it("si falla el equipo, igual devuelve el personaje", async () => {
    mockFetch((u) => (u.includes("/equipment") ? { status: 500, body: "x" } : { status: 200, body: info }));
    const body = await (await characterGET(req(url))).json();
    expect(body.snapshot.itemLevel).toBe(2400);
    expect(body.snapshot.warnings).toContain("equipment_unavailable");
  });

  it("404 de PLAYNC → not_found", async () => {
    mockFetch(() => ({ status: 404, body: {} }));
    const res = await characterGET(req(url));
    expect(res.status).toBe(404);
  });

  it("formato irreconocible → upstream_changed (con raw en debug)", async () => {
    mockFetch(() => ({ status: 200, body: { code: "ERR" } }));
    const res = await characterGET(req(`${url}&debug=1`));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream_changed");
    expect(body.raw.info).toEqual({ code: "ERR" });
  });

  it("valida parámetros", async () => {
    expect((await characterGET(req("/api/character?region=naw&serverId=2201"))).status).toBe(400);
    expect((await characterGET(req("/api/character?region=zz&serverId=2201&characterId=abcdef"))).status).toBe(400);
  });
});
