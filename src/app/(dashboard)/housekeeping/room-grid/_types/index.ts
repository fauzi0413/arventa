import { UnitStatus } from '../../../units/_types';

export interface RoomTransferInput {
  tenantName: string;
  tenantPhone?: string;
  checkInDate: string;
  sourceUnitId: string;
  sourceUnitName: string;
  targetUnitId: string;
}
