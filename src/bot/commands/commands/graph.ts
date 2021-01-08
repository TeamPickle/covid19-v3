import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { MessageAttachment } from 'discord.js';
import { CanvasRenderService } from 'chartjs-node-canvas';
import Chart from '@src/bot/models/chartModel';

const getGraphData = async () => {
  const data = await Chart
    .find()
    .limit(7)
    .sort('-date');
  return data.map((e) => ({
    confirmed: e.confirmed,
    released: e.released,
    death: e.death,
    date: e.date,
  }));
};

export default class GraphCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'graph',
      aliases: ['그래프'],
      description: 'graph command',
      group: 'commands',
      memberName: 'graph',
    });
  }

  run = async (msg: CommandoMessage) => {
    const canvasRenderService = new CanvasRenderService(640, 480, (chartJS) => {
      chartJS.plugins.register({
        beforeDraw: (chart) => {
          const { ctx } = chart;
          if (!ctx || !chart.width || !chart.height) return;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, chart.width, chart.height);
        },
        afterDraw: (chart) => {
          const { ctx } = chart;
          if (!ctx || !chart.data.datasets) return;

          ctx.textAlign = 'center';
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            meta.data.forEach((bar, index) => {
              if (!dataset.data) return;
              const data = dataset.data[index];
              if (!data || typeof data !== 'number' || !dataset.borderColor) return;
              ctx.fillStyle = dataset.borderColor.toString();
              ctx.fillText(data.toFixed(), bar._model.x, bar._model.y - 15);
            });
          });
        },
      });
    });

    const data = await getGraphData();

    const buffer = await canvasRenderService.renderToBuffer({
      type: 'line',
      data: {
        labels: data.map((e) => e.date),
        datasets: [{
          label: '신규확진',
          data: data.map((e) => e.confirmed),
          fill: false,
          backgroundColor: 'red',
          borderColor: 'red',
          lineTension: 0.3,
        }, {
          label: '격리해제',
          data: data.map((e) => e.released),
          fill: false,
          backgroundColor: 'green',
          borderColor: 'green',
          lineTension: 0.3,
        }, {
          label: '사망',
          data: data.map((e) => e.death),
          fill: false,
          backgroundColor: 'gray',
          borderColor: 'gray',
          lineTension: 0.3,
          yAxisID: 'sub',
        }],
      },
      options: {
        scales: {
          xAxes: [{
            type: 'time',
            distribution: 'series',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'YYYY-MM-DD',
              },
            },
            offset: true,
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true,
            },
          }, {
            id: 'sub',
            position: 'right',
            ticks: {
              beginAtZero: true,
            },
          }],
        },
      },
    });
    return msg.channel.send(new MessageAttachment(buffer));
  }
}
