ALTER TABLE `Campaign`
  MODIFY `type` ENUM('BUY_2_GET_2', 'PERCENT_DISCOUNT', 'BUY_X_PAY_Y') NOT NULL DEFAULT 'BUY_2_GET_2',
  ADD COLUMN `discountPercent` DECIMAL(5, 2) NULL,
  ADD COLUMN `buyQuantity` INTEGER NULL,
  ADD COLUMN `payQuantity` INTEGER NULL;

UPDATE `Campaign`
SET `buyQuantity` = 4, `payQuantity` = 2
WHERE `type` = 'BUY_2_GET_2'
  AND (`buyQuantity` IS NULL OR `payQuantity` IS NULL);
