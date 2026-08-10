import type { User } from '../types';

export const GAURAV_ID = 'IQewhJrjzzVORIjYuOKn1Lau8MG3' as const;
export const RADHIKA_ID = '5udg1iXlBVUctWsd0nMzT2LQECt2' as const;

export const LEGACY_GAURAV_ID = 'GQMi1IhBIAh8IFfKyQ4FMBwXPMs1' as const;
export const LEGACY_RADHIKA_ID = 'y0wo2ZQ8NAQEXEcZLFjVGYPoT1e2' as const;

export const defaultUsers: Record<string, User> = {
  [GAURAV_ID]: {
    uid: GAURAV_ID,
    name: 'Gaurav',
    email: '',
    avatar: '',
    bio: '',
    dateOfBirth: '',
    interests: [],
    skills: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  [LEGACY_GAURAV_ID]: {
    uid: LEGACY_GAURAV_ID as any,
    name: 'Gaurav',
    email: '',
    avatar: '',
    bio: '',
    dateOfBirth: '',
    interests: [],
    skills: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  [RADHIKA_ID]: {
    uid: RADHIKA_ID,
    name: 'Radhika',
    email: '',
    avatar: '',
    bio: '',
    dateOfBirth: '',
    interests: [],
    skills: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  [LEGACY_RADHIKA_ID]: {
    uid: LEGACY_RADHIKA_ID as any,
    name: 'Radhika',
    email: '',
    avatar: '',
    bio: '',
    dateOfBirth: '',
    interests: [],
    skills: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const mockUsers = defaultUsers;
