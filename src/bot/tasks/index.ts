import cron from 'node-cron';
import client from '..';
import Charts from '../models/chartModel';

const changeActivity = (activity: string) => {
  client.user?.setPresence({
    status: 'dnd',
    activity: {
      name: activity,
      type: 'PLAYING',
    },
  });
};

const startTask = () => {
  cron.schedule('0,15,30,45 * * * * *', () => {
    changeActivity('!도움 으로 명령어 확인');
  });
  cron.schedule('5,20,35,50 * * * * *', () => {
    changeActivity(`${client.guilds.cache.size}개 서버에서 정보 확인`);
  });
  cron.schedule('10,25,40,55 * * * * *', async () => {
    const chart = await Charts.findOne({}).sort('-date');
    changeActivity(`현재 누적 확진자수 : ${chart?.confirmedAcc}명`);
  });
};

export default startTask;
