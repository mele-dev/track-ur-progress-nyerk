import { NextResponse } from "next/server";
import { UpstreamError } from "./client";
import type { ApiError, ApiErrorCode } from "./types";

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  not_found: 404,
  upstream_blocked: 503,
  upstream_unreachable: 502,
  upstream_changed: 502,
};

export function errorJson(code: ApiErrorCode, message: string, upstreamStatus?: number, extra?: object) {
  const body: ApiError & object = { error: code, message, status: upstreamStatus, ...extra };
  return NextResponse.json(body, { status: STATUS[code], headers: { "Cache-Control": "no-store" } });
}

export function errorFrom(err: unknown) {
  if (err instanceof UpstreamError) return errorJson(err.code, err.message, err.status);
  return errorJson("upstream_unreachable", err instanceof Error ? err.message : "Error desconocido");
}
