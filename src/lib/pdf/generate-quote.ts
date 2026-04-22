import type { ProjectMaterial, QuoteExportData } from "@/types/quote";

type TextOptions = {
  bold?: boolean;
  size?: number;
};

type TableColumn = {
  align?: "left" | "right";
  label: string;
  width: number;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

class PdfDocument {
  private pages: string[][] = [];
  private page: string[] = [];
  private y = PAGE_HEIGHT - PAGE_MARGIN;

  constructor() {
    this.addPage();
  }

  addPage() {
    this.page = [];
    this.pages.push(this.page);
    this.y = PAGE_HEIGHT - PAGE_MARGIN;
  }

  addTitle(text: string) {
    this.ensureSpace(36);
    this.drawText(text, PAGE_MARGIN, this.y, { bold: true, size: 22 });
    this.y -= 34;
  }

  addSectionTitle(text: string) {
    this.ensureSpace(32);
    this.y -= 8;
    this.drawText(text, PAGE_MARGIN, this.y, { bold: true, size: 13 });
    this.y -= 16;
    this.drawLine(PAGE_MARGIN, this.y, PAGE_WIDTH - PAGE_MARGIN, this.y);
    this.y -= 14;
  }

  addKeyValue(label: string, value: string) {
    this.ensureSpace(18);
    this.drawText(label, PAGE_MARGIN, this.y, { bold: true, size: 9 });
    this.drawText(value, PAGE_MARGIN + 130, this.y, { size: 10 });
    this.y -= 16;
  }

  addParagraph(text: string) {
    this.addWrappedText(text, PAGE_MARGIN, CONTENT_WIDTH, { size: 10 });
    this.y -= 6;
  }

  addTable(columns: TableColumn[], rows: string[][]) {
    this.ensureSpace(42);
    this.drawTableRow(columns, columns.map((column) => column.label), true);

    for (const row of rows) {
      this.drawTableRow(columns, row, false);
    }

    this.y -= 6;
  }

  addTotals(rows: Array<[string, string]>) {
    const labelX = PAGE_WIDTH - PAGE_MARGIN - 190;
    const valueX = PAGE_WIDTH - PAGE_MARGIN;

    this.ensureSpace(rows.length * 18 + 12);
    this.drawLine(labelX, this.y, valueX, this.y);
    this.y -= 16;

    for (const [label, value] of rows) {
      const isTotal = label === "Total";

      this.drawText(label, labelX, this.y, {
        bold: isTotal,
        size: isTotal ? 12 : 10,
      });
      this.drawText(value, valueX, this.y, {
        align: "right",
        bold: isTotal,
        size: isTotal ? 12 : 10,
      });
      this.y -= isTotal ? 20 : 16;
    }
  }

  finish(): Uint8Array {
    const objects: string[] = [];
    objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objects[3] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
    const pageObjectIds: number[] = [];
    let nextObjectId = 5;

    for (const page of this.pages) {
      const content = page.join("\n");
      const contentId = nextObjectId;
      const pageId = nextObjectId + 1;

      objects[contentId - 1] =
        `<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`;
      objects[pageId - 1] = [
        "<< /Type /Page",
        "/Parent 2 0 R",
        `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
        "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>",
        `/Contents ${contentId} 0 R`,
        ">>",
      ].join(" ");

      pageObjectIds.push(pageId);
      nextObjectId += 2;
    }

    objects[1] = `<< /Type /Pages /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${pageObjectIds.length} >>`;

    return buildPdf(objects);
  }

  private drawTableRow(
    columns: TableColumn[],
    values: string[],
    isHeader: boolean,
  ) {
    const rowHeight = isHeader ? 22 : 20;

    this.ensureSpace(rowHeight + 6);

    if (isHeader) {
      this.drawLine(
        PAGE_MARGIN,
        this.y + 7,
        PAGE_WIDTH - PAGE_MARGIN,
        this.y + 7,
      );
    }

    let x = PAGE_MARGIN;

    for (const [index, column] of columns.entries()) {
      const value = fitText(values[index] ?? "", column.width, isHeader ? 8 : 9);
      const textX = column.align === "right" ? x + column.width - 4 : x;

      this.drawText(value, textX, this.y, {
        align: column.align,
        bold: isHeader,
        size: isHeader ? 8 : 9,
      });
      x += column.width;
    }

    this.y -= rowHeight;
    this.drawLine(
      PAGE_MARGIN,
      this.y + 8,
      PAGE_WIDTH - PAGE_MARGIN,
      this.y + 8,
    );
  }

  private addWrappedText(
    text: string,
    x: number,
    width: number,
    options: TextOptions,
  ) {
    const size = options.size ?? 10;
    const lines = wrapText(text, width, size);

    for (const line of lines) {
      this.ensureSpace(size + 6);
      this.drawText(line, x, this.y, options);
      this.y -= size + 5;
    }
  }

  private drawText(
    text: string,
    x: number,
    y: number,
    options: TextOptions & { align?: "left" | "right" } = {},
  ) {
    const size = options.size ?? 10;
    const font = options.bold ? "F2" : "F1";
    const safeText = escapePdfText(toPdfText(text));
    const textWidth = estimateTextWidth(text, size);
    const resolvedX = options.align === "right" ? x - textWidth : x;

    this.page.push(
      `BT /${font} ${size} Tf 1 0 0 1 ${formatNumber(resolvedX)} ${formatNumber(
        y,
      )} Tm (${safeText}) Tj ET`,
    );
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number) {
    this.page.push(
      `0.75 w ${formatNumber(x1)} ${formatNumber(y1)} m ${formatNumber(
        x2,
      )} ${formatNumber(y2)} l S`,
    );
  }

  private ensureSpace(height: number) {
    if (this.y - height < PAGE_MARGIN) {
      this.addPage();
    }
  }
}

export async function generateQuotePdf(
  data: QuoteExportData,
): Promise<Uint8Array> {
  const pdf = new PdfDocument();

  pdf.addTitle("Installation Quote");
  pdf.addParagraph("Generated by Plan2Ponuda for review and client sharing.");
  pdf.addSectionTitle("Project");
  pdf.addKeyValue("Project name", data.project.name);
  pdf.addKeyValue("Client name", data.project.clientName ?? "Not specified");
  pdf.addKeyValue("Object type", formatObjectType(data.project.objectType));
  pdf.addKeyValue("Area", formatArea(data.project.areaM2));
  pdf.addKeyValue("Generated", formatDate(data.generatedAt));

  if (data.rooms.length > 0) {
    pdf.addSectionTitle("Room Summary");
    pdf.addTable(
      [
        { label: "Room", width: 170 },
        { label: "Type", width: 105 },
        { align: "right", label: "Sockets", width: 70 },
        { align: "right", label: "Switches", width: 70 },
        { align: "right", label: "Lights", width: 70 },
      ],
      data.rooms.map((room) => [
        room.name,
        formatRoomType(room.type),
        room.resolvedSockets.toString(),
        room.resolvedSwitches.toString(),
        room.resolvedLights.toString(),
      ]),
    );
  }

  pdf.addSectionTitle("Materials");
  pdf.addTable(
    [
      { label: "Material", width: 180 },
      { label: "Category", width: 85 },
      { align: "right", label: "Qty", width: 65 },
      { align: "right", label: "Unit", width: 70 },
      { align: "right", label: "Total", width: 85 },
    ],
    data.materials.map(formatMaterialRow),
  );

  pdf.addSectionTitle("Totals");
  pdf.addTotals([
    ["Material cost", formatMoney(data.quote.materialCost)],
    ["Labor cost", formatMoney(data.quote.laborCost)],
    ["Subtotal", formatMoney(data.quote.subtotal)],
    ["Total", formatMoney(data.quote.total)],
  ]);

  return pdf.finish();
}

function formatMaterialRow(projectMaterial: ProjectMaterial): string[] {
  const material = projectMaterial.material;
  const unit = material?.unit ?? "";

  return [
    material?.name ?? "Material",
    material?.category ?? "other",
    `${formatQuantity(projectMaterial.quantity)} ${unit}`.trim(),
    formatMoney(projectMaterial.unitPrice),
    formatMoney(projectMaterial.totalPrice),
  ];
}

function buildPdf(objects: string[]): Uint8Array {
  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [0];
  let offset = byteLength(chunks[0]);

  for (const [index, body] of objects.entries()) {
    const object = `${index + 1} 0 obj\n${body}\nendobj\n`;

    offsets.push(offset);
    chunks.push(object);
    offset += byteLength(object);
  }

  const xrefOffset = offset;
  const xrefRows = offsets
    .map((entryOffset, index) =>
      index === 0
        ? "0000000000 65535 f "
        : `${entryOffset.toString().padStart(10, "0")} 00000 n `,
    )
    .join("\n");
  const trailer = [
    `xref\n0 ${objects.length + 1}`,
    xrefRows,
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref\n${xrefOffset}`,
    "%%EOF",
  ].join("\n");

  chunks.push(trailer);

  return new TextEncoder().encode(chunks.join(""));
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toPdfText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/€/g, "EUR")
    .replace(/[^\x20-\x7E]/g, "-");
}

function wrapText(text: string, maxWidth: number, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (estimateTextWidth(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
}

function estimateTextWidth(text: string, size: number): number {
  return toPdfText(text).length * size * 0.52;
}

function fitText(text: string, maxWidth: number, size: number): string {
  if (estimateTextWidth(text, size) <= maxWidth) {
    return text;
  }

  let fittedText = text;

  while (
    fittedText.length > 1 &&
    estimateTextWidth(`${fittedText}...`, size) > maxWidth
  ) {
    fittedText = fittedText.slice(0, -1);
  }

  return `${fittedText}...`;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function formatMoney(value: string): string {
  return `EUR ${Number(value).toFixed(2)}`;
}

function formatQuantity(value: string): string {
  const numericValue = Number(value);

  if (Number.isInteger(numericValue)) {
    return numericValue.toString();
  }

  return numericValue.toFixed(2);
}

function formatArea(value: number): string {
  return `${value.toFixed(2)} m2`;
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 16).replace("T", " ");
}

function formatObjectType(objectType: string): string {
  const labels: Record<string, string> = {
    apartment: "Apartment",
    house: "House",
    office: "Office",
  };

  return labels[objectType] ?? objectType;
}

function formatRoomType(roomType: string): string {
  const labels: Record<string, string> = {
    bathroom: "Bathroom",
    bedroom: "Bedroom",
    hallway: "Hallway",
    kitchen: "Kitchen",
    living_room: "Living room",
    office: "Office",
    unknown: "Unknown",
  };

  return labels[roomType] ?? roomType;
}
