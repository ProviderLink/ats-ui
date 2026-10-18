import type { Client, UpdateClientDto } from '@/store/types';
import { CompanySize } from '@/store/types';
import type { DefaultValues } from 'react-hook-form';
import { z } from 'zod';

export const COMPANY_SIZES = Object.values(CompanySize);

export const clientFormSchema = z.object({
  companyName: z.string().min(1, 'Required').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.enum(COMPANY_SIZES).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  description: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  contactName: z.string().optional(),
  contactEmail: z
    .string()
    .email('Invalid contact email')
    .optional()
    .or(z.literal('')),
  contactPhone: z.string().optional(),
  contactPosition: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

function sanitizeCompanySize(v?: string): CompanySize | undefined {
  if (v === '1-50') return CompanySize['11-50'];
  return COMPANY_SIZES.find(size => size === v);
}

export function getClientFormDefaults(
  client?: Client
): DefaultValues<ClientFormValues> {
  const contact = {
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactPosition: '',
  };
  if (!client) return { address: {}, ...contact };
  return {
    companyName: client.companyName,
    email: client.email,
    phone: client.phone ?? '',
    website: client.website ?? '',
    industry: client.industry ?? '',
    companySize: sanitizeCompanySize(client.companySize),
    status: client.status as ClientFormValues['status'],
    description: client.description ?? '',
    address: client.address ?? {},
    ...contact,
  };
}

export function buildClientUpdatePayload(
  values: ClientFormValues
): UpdateClientDto {
  const {
    contactName: _contactName,
    contactEmail: _contactEmail,
    contactPhone: _contactPhone,
    contactPosition: _contactPosition,
    ...clientData
  } = values;
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(clientData)) {
    if (v === undefined) continue;
    if (k === 'address' && v && typeof v === 'object') {
      const addr: Record<string, unknown> = {};
      for (const [ak, av] of Object.entries(v)) {
        if (av) addr[ak] = av;
      }
      payload.address = addr;
    } else {
      payload[k] = v;
    }
  }
  return payload as UpdateClientDto;
}
