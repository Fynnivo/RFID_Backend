/*
  Warnings:

  - You are about to drop the column `details` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `resource` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `audit_logs` table. All the data in the column will be lost.
  - Added the required column `description` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `audit_logs` DROP COLUMN `details`,
    DROP COLUMN `ipAddress`,
    DROP COLUMN `resource`,
    DROP COLUMN `userAgent`,
    ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `ip` VARCHAR(191) NULL,
    ADD COLUMN `scheduleId` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL;
