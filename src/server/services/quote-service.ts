import type { QuoteLineItem as DbQuoteLineItem } from "@prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";
import type { Quote } from "@/types/quote";

function mapLineItem(lineItem: DbQuoteLineItem) {
  return {
    id: lineItem.id,
    name: lineItem.name,
    quantity: lineItem.quantity,
    unit: lineItem.unit,
    unitPriceCents: lineItem.unitPriceCents,
  };
}

export async function getQuoteForProject(
  projectId: string,
  ownerId: string,
): Promise<Quote | null> {
  const prisma = getPrismaClient();
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId,
    },
    include: {
      quote: {
        include: {
          lineItems: true,
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  if (!project.quote) {
    return {
      id: "placeholder-quote-id",
      projectId,
      lineItems: [],
      totalCents: 0,
    };
  }

  return {
    id: project.quote.id,
    projectId,
    lineItems: project.quote.lineItems.map(mapLineItem),
    totalCents: project.quote.totalCents,
  };
}
