import fetch from 'node-fetch';
import { CoronaBoardData } from '@src/types/board';

export const format = (x: number) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const increase = (i: number) => (
  // eslint-disable-next-line no-nested-ternary
  i > 0 ? `▲${format(i)}`
    : i < 0 ? `▼${format(i)}` : '-0');

export const parseBoard = async () => {
  const data = (await (await fetch('https://coronaboard.kr')).text()).match(/jsonData = (.*?);<\/script/)?.[1];
  if (!data) return null;
  return JSON.parse(data) as CoronaBoardData;
};
