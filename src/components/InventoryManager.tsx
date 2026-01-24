import React from 'react';
import { useInventoryLogic } from '../hooks/useInventoryLogic';
import { InventoryGenericTemplate } from './inventory/InventoryGenericTemplate';
import { InventoryMobileCardTemplate } from './inventory/InventoryMobileCardTemplate';

const InventoryManager: React.FC = () => {
  const logic = useInventoryLogic();

  return (
    <>
      <InventoryGenericTemplate {...logic} />
      <InventoryMobileCardTemplate {...logic} />
    </>
  );
};

export default InventoryManager;
