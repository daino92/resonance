export const seconds = (n: number) =>
  `0:${String(Math.floor(n)).padStart(2, '0')}`;
