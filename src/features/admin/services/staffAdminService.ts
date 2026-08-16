import { staffClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { StaffMember } from '@/shared/proto/admin';

export async function listStaffForEvent(eventsId: string): Promise<StaffMember[]> {
  const response = await callRpc(() => staffClient.listStaffForEvent({ value: eventsId }));
  return response.staff;
}

export async function unassignStaff(usersId: string, eventsId: string): Promise<void> {
  await callRpc(() => staffClient.unassignStaff({ usersId, eventsId, accessStart: '0', accessEnd: '0' }));
}

export async function assignStaffByEmail(email: string, eventsId: string, role: number): Promise<{ userExisted: boolean; message: string }> {
  const response = await callRpc(() => staffClient.assignStaffByEmail({ email, eventsId, role }));
  return { userExisted: response.userExisted, message: response.message };
}

export async function updateStaffAccessWindow(
  usersId: string,
  eventsId: string,
  accessStart: number,
  accessEnd: number,
): Promise<void> {
  await callRpc(() =>
    staffClient.updateStaffAccessWindow({
      usersId,
      eventsId,
      accessStart: String(accessStart),
      accessEnd: String(accessEnd),
    }),
  );
}

export async function listAllStaff(): Promise<StaffMember[]> {
  const response = await callRpc(() => staffClient.listAllStaff({}));
  return response.staff;
}

export async function removeStaffRole(usersId: string): Promise<void> {
  await callRpc(() => staffClient.removeStaffRole({ value: usersId }));
}
