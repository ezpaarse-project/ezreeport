import { parseISO } from 'date-fns';
import axios, { type ApiResponse } from '../lib/axios';

interface RawInstitution {
  id: string;
  name: string;
  website?: string;
  uai?: string;
  auto: {
    ezmesure: boolean;
    ezpaarse: boolean;
    report: boolean;
    sushi?: boolean;
  };
  validated?: boolean;
  indexCount?: number;
  domains?: string[];
  logoId?: string;
  updatedAt?: string;
  createdAt: string;
  acronym?: string;
  city?: string;
  type?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  creator?: string;
  youtubeUrl?: string;
  indexPrefix?: string;
  role?: string;
  space?: string;
  docContactName?: string;
  techContactName?: string;
  hidePartner?: boolean;
  sushiReadySince?: string;
}

export interface Institution extends Omit<RawInstitution, 'updatedAt' | 'createdAt' | 'sushiReadySince'> {
  updatedAt?: Date
  createdAt: Date
  sushiReadySince?: Date
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param institution Raw institution
 *
 * @returns Parsed institution
 */
const parseInstitution = (institution: RawInstitution): Institution => ({
  ...institution,
  createdAt: parseISO(institution.createdAt),
  updatedAt: institution.updatedAt ? parseISO(institution.updatedAt) : undefined,
  sushiReadySince: institution.sushiReadySince ? parseISO(institution.sushiReadySince) : undefined,
});

/**
 * Get all available institutions for authed user
 *
 * Needs `institutions-get` permission
 *
 * @returns Available institutions
 */
export const getInstitutions = async (): Promise<ApiResponse<Institution[]>> => {
  const { content, ...response } = await axios.$get<RawInstitution[]>('/institutions');
  return {
    ...response,
    content: content.map(parseInstitution),
  };
};

/**
 * Get specific institution that is available for authed user
 *
 * Needs `institutions-get-id` permission
 *
 * @returns Available institution
 */
export const getInstitution = async (id: Institution['id']): Promise<ApiResponse<Institution>> => {
  const { content, ...response } = await axios.$get<RawInstitution>(`/institutions/${id}`);
  return {
    ...response,
    content: parseInstitution(content),
  };
};
