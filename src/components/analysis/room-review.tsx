type RoomReviewProps = {
  title: string;
};

export function RoomReview({ title }: RoomReviewProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Room detection review placeholder.
      </p>
    </section>
  );
}
