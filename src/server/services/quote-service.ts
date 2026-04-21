import type { Quote as DbQuote } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { Quote } from "@/types/quote";

function mapQuote(quote: DbQuote): Quote {
  return {
    id: quote.id,
    projectId: quote.projectId,
    laborCost: quote.laborCost.toString(),
    materialCost: quote.materialCost.toString(),
    subtotal: quote.subtotal.toString(),
    total: quote.total.toString(),
    pdfPath: quote.pdfPath ?? undefined,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };
}

export async function getQuoteForProject(
  projectId: string,
  userId: string,
): Promise<Quote | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      quote: true,
    },
  });

  if (!project?.quote) {
    return null;
  }

  return mapQuote(project.quote);
}

export async function createQuotePlaceholder(
  projectId: string,
  userId: string,
): Promise<Quote | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return null;
  }

  return null;
}
