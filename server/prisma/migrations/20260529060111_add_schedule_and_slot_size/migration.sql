-- AlterTable
ALTER TABLE "ParkingListing" ADD COLUMN     "slotSize" TEXT NOT NULL DEFAULT 'MEDIUM';

-- CreateTable
CREATE TABLE "AvailabilitySchedule" (
    "id" TEXT NOT NULL,
    "parkingListingId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AvailabilitySchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AvailabilitySchedule" ADD CONSTRAINT "AvailabilitySchedule_parkingListingId_fkey" FOREIGN KEY ("parkingListingId") REFERENCES "ParkingListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
