import { Client, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';
import Locations from '@src/bot/models/locationModel';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';

interface Hospital {
  city: string;
  gu: string;
  lat: string;
  long: string;
  name: string;
  number: string;
}

const getLocation = async (userId: string, city: string, gu: string) => {
  if (city && gu) return [city, gu] as const;
  const row = await Locations.findById(userId);
  if (!row) return ['', ''] as const;
  const [a, b] = row.location.split(' ');
  return [a, b] as const;
};

const searchHospital = async (city: string, gu: string) => {
  const response = await fetch(
    encodeURI(`http://happycastle.xyz/hospital?city=${city}&gu=${gu}`),
  );
  const { status } = response;

  if (status === 500) return 'API Error';
  if (status === 404) return '해당 지역에서 병원을 찾을 수 없습니다.';
  return (await response.json()) as Hospital[];
};

const getEmbedByHospitalData = (data: Hospital[]) => {
  const embed = new MessageEmbed();
  embed
    .setDescription(
      data
        .map((e) => ({ ...e, name: e.name.replace(/\*\(.*\)/, '💉') }))
        .reduce(
          (prev, curr) =>
            `${prev}\n${curr.name} ${curr.number} [지도](https://www.google.co.kr/maps/search/${curr.name})`,
          '',
        )
        .slice(0, 2048),
    )
    .setColor(0x92f0f2)
    .setFooter('주사기 아이콘 : 검체채취 가능 병원');
  return embed;
};

export default class HospitalCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'hospital',
      aliases: ['병원'],
      description: 'hospital command',
    });
  }

  runCommand = async (msg: ReceivedMessage, args: string[]) => {
    const [, city, gu] = args;
    const hospitals = await searchHospital(
      ...(await getLocation(msg.author.id, city, gu)),
    );
    if (typeof hospitals === 'string') return msg.respond(hospitals);
    return msg.respond({ embeds: [getEmbedByHospitalData(hospitals)] });
  };
}
