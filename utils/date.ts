export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getTodayString = (): string => {
  return formatDate(new Date());
};

export const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const isToday = (dateString: string): boolean => {
  return dateString === getTodayString();
};