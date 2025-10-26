// services/availabilityService.ts



export async function getAvailability(weekDate: string) {
  
  const res = await fetch(`/api/availability?weekDate=${encodeURIComponent(weekDate)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // כדי לא לקבל קאש ישן
  });

  if (!res.ok) {
    throw new Error('Failed to fetch availability');
  }

  return res.json();
}

export const saveAvailability = async (payload: {
  weekDate: string;
  scheduleData: any[];
  preferredPositions: string[];
  notes: string;
}) => {
  const res = await fetch('/api/availability', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to save availability');
  return res.json();
};