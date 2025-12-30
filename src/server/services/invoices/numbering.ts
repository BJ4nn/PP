import { randomBytes } from "crypto";

export function createInvoiceNumber(now: Date) {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `INV-${yyyy}${mm}${dd}-${suffix}`;
}

export function createVariableSymbol(now: Date) {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const seq = String(randomBytes(2).readUInt16BE(0) % 10_000).padStart(4, "0");
  return `${yy}${mm}${dd}${seq}`;
}
