import { prisma } from "@/lib/db";

type SiteRef = {
  id: string;
  name: string;
};

type DeviceRef = {
  id: string;
  name: string;
  siteId: string;
  active: boolean;
};

const isSingleMatch = <T>(matches: T[]): matches is [T] => matches.length === 1;

export const resolveSiteByRef = async (siteRef: string): Promise<SiteRef | null> => {
  const value = siteRef.trim();
  if (!value) {
    return null;
  }

  const matches = await prisma.site.findMany({
    where: {
      OR: [{ id: value }, { name: value }],
    },
    select: {
      id: true,
      name: true,
    },
    take: 2,
  });

  return isSingleMatch(matches) ? matches[0] : null;
};

export const resolveDeviceByRef = async (deviceRef: string): Promise<DeviceRef | null> => {
  const value = deviceRef.trim();
  if (!value) {
    return null;
  }

  const matches = await prisma.device.findMany({
    where: {
      OR: [{ id: value }, { name: value }],
    },
    select: {
      id: true,
      name: true,
      siteId: true,
      active: true,
    },
    take: 2,
  });

  return isSingleMatch(matches) ? matches[0] : null;
};
