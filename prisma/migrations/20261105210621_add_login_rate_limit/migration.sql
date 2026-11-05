CREATE TABLE IF NOT EXISTS "login_rate_limit" (
    "ip_hash" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "window_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_rate_limit_pkey" PRIMARY KEY ("ip_hash")
);

CREATE INDEX IF NOT EXISTS "login_rate_limit_updated_at_idx" ON "login_rate_limit"("updated_at");
