import type { Quote } from "@/types/quote";

export async function generateQuotePdf(quote: Quote): Promise<ArrayBuffer> {
  const content = `Plan2Ponuda quote placeholder: ${quote.id}`;
  const bytes = new TextEncoder().encode(content);
  const buffer = new ArrayBuffer(bytes.byteLength);

  new Uint8Array(buffer).set(bytes);

  return buffer;
}
