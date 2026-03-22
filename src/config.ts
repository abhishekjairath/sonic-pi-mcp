/**
 * OSC / Sonic Pi connection settings (env overridable).
 */
export function getOscHost(): string {
  return process.env.OSC_HOST?.trim() || "127.0.0.1";
}

export function getOscPort(): number {
  const raw = process.env.OSC_PORT;
  if (raw === undefined || raw === "") return 4560;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    console.error(`Invalid OSC_PORT: ${raw}, using 4560`);
    return 4560;
  }
  return n;
}

/** OSC path for code the DJ session runner receives (default matches Sonic Pi incoming run-code). */
export function getOscCodePath(): string {
  return process.env.OSC_CODE_PATH?.trim() || "/run-code";
}

/** Hard stop — Sonic Pi GUI API (see Sonic Pi wiki). */
export function getOscStopAllPath(): string {
  return process.env.OSC_STOP_ALL_PATH?.trim() || "/stop-all-jobs";
}
