ALTER TABLE "Subscription"
ADD COLUMN "stripeLatestEventId" TEXT,
ADD COLUMN "stripeLatestEventCreated" TIMESTAMP(3);

CREATE INDEX "Subscription_stripeLatestEventCreated_idx" ON "Subscription"("stripeLatestEventCreated");
