export const locations = ['합계', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'] as const;

export default <{
  [key in typeof locations[number]]: {
    x: number;
    y: number;
    textX: number;
    textY: number;
    align: 'left' | 'right';
  };
}>{
  서울: {
    x: 345,
    y: 342,
    textX: 270,
    textY: 23,
    align: 'right',
  },
  부산: {
    x: 633,
    y: 755,
    textX: 1400,
    textY: 775,
    align: 'left',
  },
  대구: {
    x: 570,
    y: 648,
    textX: 1400,
    textY: 513,
    align: 'left',
  },
  인천: {
    x: 276,
    y: 353,
    textX: 270,
    textY: 200,
    align: 'right',
  },
  광주: {
    x: 331,
    y: 776,
    textX: 270,
    textY: 915,
    align: 'right',
  },
  대전: {
    x: 413,
    y: 562,
    textX: 270,
    textY: 675,
    align: 'right',
  },
  울산: {
    x: 662,
    y: 700,
    textX: 1400,
    textY: 685,
    align: 'left',
  },
  세종: {
    x: 396,
    y: 519,
    textX: 270,
    textY: 520,
    align: 'right',
  },
  경기: {
    x: 244,
    y: 234,
    textX: 270,
    textY: 300,
    align: 'right',
  },
  강원: {
    x: 389,
    y: 172,
    textX: 1400,
    textY: 167,
    align: 'left',
  },
  충북: {
    x: 413,
    y: 426,
    textX: 1400,
    textY: 253,
    align: 'left',
  },
  충남: {
    x: 248,
    y: 454,
    textX: 270,
    textY: 410,
    align: 'right',
  },
  전북: {
    x: 293,
    y: 618,
    textX: 270,
    textY: 775,
    align: 'right',
  },
  전남: {
    x: 143,
    y: 739,
    textX: 270,
    textY: 1000,
    align: 'right',
  },
  경북: {
    x: 489,
    y: 366,
    textX: 1400,
    textY: 423,
    align: 'left',
  },
  경남: {
    x: 463,
    y: 664,
    textX: 1400,
    textY: 933,
    align: 'left',
  },
  제주: {
    x: 610,
    y: 898,
    textX: 1400,
    textY: 1023,
    align: 'left',
  },
};
