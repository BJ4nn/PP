ALTER TABLE "Job"
ALTER COLUMN "bundleHourlyRateEur" TYPE DECIMAL(10,2)
USING "bundleHourlyRateEur"::DECIMAL(10,2);
