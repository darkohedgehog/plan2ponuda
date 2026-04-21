async function main(): Promise<void> {
  // Starter material seeding will live here once the catalog is agreed.
  // Suggested shape:
  // await prisma.material.createMany({
  //   data: [
  //     {
  //       code: "SOCKET-SCHUKO",
  //       name: "Schuko socket",
  //       unit: "pcs",
  //       defaultPrice: new Prisma.Decimal("0.00"),
  //       category: "socket",
  //     },
  //   ],
  // });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
