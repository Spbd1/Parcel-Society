-- Initial Parcel Society schema for production deployments.

CREATE TYPE "UserRole" AS ENUM ('PARTICIPANT', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "ServerStatus" AS ENUM ('DRAFT', 'WAITING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "InequalityCondition" AS ENUM ('LOW', 'HIGH');
CREATE TYPE "UncertaintyCondition" AS ENUM ('STABLE', 'UNCERTAIN');
CREATE TYPE "SeasonStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "RoundStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESOLVED');
CREATE TYPE "ActionType" AS ENUM ('PRODUCE', 'PRODUCTIVE_INVESTMENT', 'SAFE_ASSET', 'PUBLIC_CONTRIBUTION', 'INFORMAL_CONTRACT', 'FORMAL_CONTRACT', 'LOBBYING', 'EXIT');
CREATE TYPE "ContractType" AS ENUM ('FORMAL', 'INFORMAL');
CREATE TYPE "ServerEventType" AS ENUM ('TAX_CHANGE', 'FORMAL_CONTRACT_FEE_CHANGE', 'SHOCK_PROBABILITY_CHANGE', 'RESOURCE_SHOCK', 'INFO');
CREATE TYPE "TreasuryTransactionType" AS ENUM ('CONTRIBUTION', 'TAX', 'FEE', 'FINE', 'PUBLIC_SPENDING', 'PAYOUT', 'ADJUSTMENT');
CREATE TYPE "ExportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "anonymousId" TEXT NOT NULL,
  "email" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'PARTICIPANT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Server" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ServerStatus" NOT NULL DEFAULT 'DRAFT',
  "inequalityCondition" "InequalityCondition" NOT NULL,
  "uncertaintyCondition" "UncertaintyCondition" NOT NULL,
  "maxPlayers" INTEGER NOT NULL,
  "currentRound" INTEGER NOT NULL DEFAULT 0,
  "seasonLength" INTEGER NOT NULL DEFAULT 7,
  "treasury" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "randomSeed" TEXT NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServerConfig" (
  "id" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServerConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Season" (
  "id" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "status" "SeasonStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Round" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "status" "RoundStatus" NOT NULL DEFAULT 'PENDING',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Player" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "parcelId" TEXT NOT NULL,
  "wealth" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "productiveCapital" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "safeAsset" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "reputation" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "exited" BOOLEAN NOT NULL DEFAULT false,
  "roundExited" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Parcel" (
  "id" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "x" INTEGER NOT NULL,
  "y" INTEGER NOT NULL,
  "soil" DECIMAL(8,4) NOT NULL,
  "water" DECIMAL(8,4) NOT NULL,
  "marketAccess" DECIMAL(8,4) NOT NULL,
  "risk" DECIMAL(8,4) NOT NULL,
  "quality" DECIMAL(8,4) NOT NULL,
  "ownerId" TEXT,
  CONSTRAINT "Parcel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerRoundState" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "wealth" DECIMAL(14,2) NOT NULL,
  "productiveCapital" DECIMAL(14,2) NOT NULL,
  "safeAsset" DECIMAL(14,2) NOT NULL,
  "reputation" DECIMAL(8,2) NOT NULL,
  "exited" BOOLEAN NOT NULL DEFAULT false,
  "state" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlayerRoundState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Decision" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "actionType" "ActionType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "targetPlayerId" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
  "id" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "contractType" "ContractType" NOT NULL,
  "value" DECIMAL(14,2) NOT NULL,
  "fee" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "fulfilled" BOOLEAN,
  "defaulted" BOOLEAN,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServerEvent" (
  "id" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "eventType" "ServerEventType" NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServerEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TreasuryTransaction" (
  "id" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "playerId" TEXT,
  "roundNumber" INTEGER,
  "type" "TreasuryTransactionType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TreasuryTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComprehensionCheck" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "serverId" TEXT,
  "passed" BOOLEAN NOT NULL DEFAULT false,
  "score" INTEGER NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "answers" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComprehensionCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExportJob" (
  "id" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "serverId" TEXT,
  "status" "ExportJobStatus" NOT NULL DEFAULT 'PENDING',
  "filePath" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_anonymousId_key" ON "User"("anonymousId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "AdminUser_userId_key" ON "AdminUser"("userId");
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE INDEX "AdminUser_createdAt_idx" ON "AdminUser"("createdAt");
CREATE UNIQUE INDEX "Server_name_key" ON "Server"("name");
CREATE INDEX "Server_status_idx" ON "Server"("status");
CREATE INDEX "Server_inequalityCondition_uncertaintyCondition_idx" ON "Server"("inequalityCondition", "uncertaintyCondition");
CREATE INDEX "Server_createdAt_idx" ON "Server"("createdAt");
CREATE UNIQUE INDEX "ServerConfig_serverId_key_key" ON "ServerConfig"("serverId", "key");
CREATE INDEX "ServerConfig_serverId_idx" ON "ServerConfig"("serverId");
CREATE INDEX "Season_serverId_status_idx" ON "Season"("serverId", "status");
CREATE INDEX "Season_startsAt_endsAt_idx" ON "Season"("startsAt", "endsAt");
CREATE UNIQUE INDEX "Round_seasonId_roundNumber_key" ON "Round"("seasonId", "roundNumber");
CREATE UNIQUE INDEX "Round_serverId_roundNumber_key" ON "Round"("serverId", "roundNumber");
CREATE INDEX "Round_serverId_status_idx" ON "Round"("serverId", "status");
CREATE INDEX "Round_startsAt_endsAt_idx" ON "Round"("startsAt", "endsAt");
CREATE UNIQUE INDEX "Player_parcelId_key" ON "Player"("parcelId");
CREATE UNIQUE INDEX "Player_userId_serverId_key" ON "Player"("userId", "serverId");
CREATE INDEX "Player_serverId_idx" ON "Player"("serverId");
CREATE INDEX "Player_exited_idx" ON "Player"("exited");
CREATE UNIQUE INDEX "Parcel_ownerId_key" ON "Parcel"("ownerId");
CREATE UNIQUE INDEX "Parcel_serverId_x_y_key" ON "Parcel"("serverId", "x", "y");
CREATE INDEX "Parcel_serverId_idx" ON "Parcel"("serverId");
CREATE INDEX "Parcel_quality_idx" ON "Parcel"("quality");
CREATE UNIQUE INDEX "PlayerRoundState_playerId_roundNumber_key" ON "PlayerRoundState"("playerId", "roundNumber");
CREATE INDEX "PlayerRoundState_serverId_roundNumber_idx" ON "PlayerRoundState"("serverId", "roundNumber");
CREATE INDEX "Decision_playerId_roundNumber_idx" ON "Decision"("playerId", "roundNumber");
CREATE INDEX "Decision_serverId_roundNumber_idx" ON "Decision"("serverId", "roundNumber");
CREATE INDEX "Decision_actionType_idx" ON "Decision"("actionType");
CREATE INDEX "Decision_targetPlayerId_idx" ON "Decision"("targetPlayerId");
CREATE INDEX "Contract_serverId_roundNumber_idx" ON "Contract"("serverId", "roundNumber");
CREATE INDEX "Contract_senderId_idx" ON "Contract"("senderId");
CREATE INDEX "Contract_receiverId_idx" ON "Contract"("receiverId");
CREATE INDEX "Contract_contractType_idx" ON "Contract"("contractType");
CREATE INDEX "ServerEvent_serverId_roundNumber_idx" ON "ServerEvent"("serverId", "roundNumber");
CREATE INDEX "ServerEvent_eventType_idx" ON "ServerEvent"("eventType");
CREATE INDEX "ServerEvent_createdAt_idx" ON "ServerEvent"("createdAt");
CREATE INDEX "TreasuryTransaction_serverId_roundNumber_idx" ON "TreasuryTransaction"("serverId", "roundNumber");
CREATE INDEX "TreasuryTransaction_playerId_idx" ON "TreasuryTransaction"("playerId");
CREATE INDEX "TreasuryTransaction_type_idx" ON "TreasuryTransaction"("type");
CREATE INDEX "TreasuryTransaction_createdAt_idx" ON "TreasuryTransaction"("createdAt");
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "ComprehensionCheck_userId_idx" ON "ComprehensionCheck"("userId");
CREATE INDEX "ComprehensionCheck_serverId_idx" ON "ComprehensionCheck"("serverId");
CREATE INDEX "ComprehensionCheck_passed_idx" ON "ComprehensionCheck"("passed");
CREATE INDEX "ExportJob_requestedById_idx" ON "ExportJob"("requestedById");
CREATE INDEX "ExportJob_serverId_idx" ON "ExportJob"("serverId");
CREATE INDEX "ExportJob_status_idx" ON "ExportJob"("status");
CREATE INDEX "ExportJob_createdAt_idx" ON "ExportJob"("createdAt");

ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServerConfig" ADD CONSTRAINT "ServerConfig_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Season" ADD CONSTRAINT "Season_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Round" ADD CONSTRAINT "Round_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Round" ADD CONSTRAINT "Round_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Player" ADD CONSTRAINT "Player_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Player" ADD CONSTRAINT "Player_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlayerRoundState" ADD CONSTRAINT "PlayerRoundState_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerRoundState" ADD CONSTRAINT "PlayerRoundState_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_targetPlayerId_fkey" FOREIGN KEY ("targetPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServerEvent" ADD CONSTRAINT "ServerEvent_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TreasuryTransaction" ADD CONSTRAINT "TreasuryTransaction_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TreasuryTransaction" ADD CONSTRAINT "TreasuryTransaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComprehensionCheck" ADD CONSTRAINT "ComprehensionCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComprehensionCheck" ADD CONSTRAINT "ComprehensionCheck_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE SET NULL ON UPDATE CASCADE;
