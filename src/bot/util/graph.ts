import { CanvasRenderService } from 'chartjs-node-canvas';

const drawGraph = (
  data: {
    confirmed: number;
    released: number;
    death: number;
    date: Date;
  }[],
) => {
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
            if (!data || typeof data !== 'number' || !dataset.backgroundColor) {
              return;
            }
            ctx.fillStyle = dataset.backgroundColor.toString();
            ctx.fillText(
              data.toFixed(),
              bar._model.x + (datasetIndex - 1) * 20,
              bar._model.y - 10,
            );
          });
        });
      },
    });
  });

  return canvasRenderService.renderToBuffer({
    type: 'line',
    data: {
      labels: data.map((e) => e.date),
      datasets: [
        {
          label: '신규확진',
          data: data.map((e) => e.confirmed),
          fill: false,
          backgroundColor: 'darkred',
          borderColor: 'red',
          lineTension: 0.3,
        },
        {
          label: '격리해제',
          data: data.map((e) => e.released),
          fill: false,
          backgroundColor: 'darkgreen',
          borderColor: 'green',
          lineTension: 0.3,
        },
        {
          label: '사망',
          data: data.map((e) => e.death),
          fill: false,
          backgroundColor: 'darkslategray',
          borderColor: 'gray',
          lineTension: 0.3,
        },
      ],
    },
    options: {
      scales: {
        xAxes: [
          {
            type: 'time',
            distribution: 'series',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'YYYY-MM-DD',
              },
            },
            offset: true,
          },
        ],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  });
};

export default drawGraph;
