import { platformLeadClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';

export interface PlatformLeadInput {
  name: string;
  companyName: string;
  phone: string;
  website: string;
  description: string;
}

export interface PlatformLeadRecord extends PlatformLeadInput {
  platformLeadsId: string;
  createdAt: number;
}

export async function createPlatformLead(input: PlatformLeadInput): Promise<string> {
  const response = await callRpc(() => platformLeadClient.createPlatformLead(input));
  return response.value;
}

export async function listPlatformLeads(): Promise<PlatformLeadRecord[]> {
  const response = await callRpc(() => platformLeadClient.listPlatformLeads({ offset: 0, limit: 200, search: '' }));
  return response.leads.map((lead) => ({
    platformLeadsId: lead.platformLeadsId,
    name: lead.name,
    companyName: lead.companyName,
    phone: lead.phone,
    website: lead.website,
    description: lead.description,
    createdAt: Number(lead.createdAt),
  }));
}
