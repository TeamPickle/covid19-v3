import fetch from 'node-fetch';
import { CoronaBoardData } from '@src/types/board';

const parseBoard = async () => {
  const data = (await (await fetch('https://coronaboard.kr')).text()).match(/jsonData = (.*?);<\/script/)?.[1];
  if (!data) return null;
  return JSON.parse(data) as CoronaBoardData;
};

export default parseBoard;
