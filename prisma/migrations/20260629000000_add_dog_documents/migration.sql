CREATE TABLE "DogDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dogId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "identifier" TEXT,
    "issuer" TEXT,
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "frontImageUrl" TEXT,
    "backImageUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DogDocument_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DogDocument_dogId_type_key" ON "DogDocument"("dogId", "type");

CREATE INDEX "DogDocument_type_idx" ON "DogDocument"("type");
