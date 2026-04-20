type RoomReviewProps = {
  title: string;
};

export function RoomReview({ title }: RoomReviewProps) {
  return (
    <section className="rounded-lg border border-border bg-white p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Room detection review placeholder.
      </p>
    </section>
  );
}
