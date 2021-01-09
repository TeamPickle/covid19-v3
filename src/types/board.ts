import disaster from '@src/bot/data/commands/disaster';

interface Status {
  active: number[];
  confirmed: number[];
  confirmed_acc: number[]; // eslint-disable-line camelcase
  date: string[];
  death: number[];
  death_acc: number[]; // eslint-disable-line camelcase
  released: number[];
  released_acc: number[]; // eslint-disable-line camelcase
}

export interface CoronaBoardData {
  lastUpdated: number;
  KR: {
    bannedList: {
      banned: {
        count: number;
        list: {
          continent: string;
          countries: string;
        }[];
      };
      bannedRemoved: {
        count: number;
        list: {
          continent: string;
          countries: string;
        }[];
      };
      flightBanned: string[];
      lastUpdate: string;
      quarantined: {
        count: number;
        list: {
          continent: string;
          countries: string;
        }[];
      };
      restricted: {
        count: number;
        list: {
          continent: string;
          countries: string;
        }[];
      };
      sourceLink: string;
      sourceTitle: string;
    };
    chartByAge: {
      data: {
        [key in 'confirmed' | 'death' | 'released']: {
          [age in '0-9세' | '10대' | '20대' | '30대' | '40대' | '50대' | '60대' | '70대' | '80대 이상']: number;
        };
      };
      time: string;
    };
    chartByGender: {
      data: {
        [key in 'confirmed' | 'death' | 'released']: {
          [gender in 'male' | 'female']: number;
        };
      };
      time: string;
    };
    chartBySource: {
      all: {
        data: {
          [key: string]: {
            [reason: string]: number;
          }
        };
        time: string;
      };
      recent: {
        data: {
          [key: string]: {
            [reason: string]: number;
          }
        };
        time: string;
      };
    };
    chartTesting: {
      confirm_rate: number[]; // eslint-disable-line camelcase
      confirm_rate_acc: number[]; // eslint-disable-line camelcase
      confirmed: number[];
      confirmed_acc: number[]; // eslint-disable-line camelcase
      date: string[];
      negative: number[];
      negative_acc: number[]; // eslint-disable-line camelcase
      testing: number[];
    };
    noticeFeature: {
      feature: {
        type: 'feature';
        html: string;
      }[];
      notice: {
        type: 'notice';
        html: string;
      }[];
    };
    patientLogUpdate: {
      order: string;
      open: string;
      message: string;
      source_text: string; // eslint-disable-line camelcase
      source_link: string; // eslint-disable-line camelcase
    }[];
    sdLevel: {
      [key: string]: string;
    };
    statByKrLocation: {
      region: string;
      confirmed: number;
      active: number;
      released: number;
      death: number;
      population: number;
      incidence: number;
      confirmed_prev: number; // eslint-disable-line camelcase
      released_prev: number; // eslint-disable-line camelcase
      death_prev: number; // eslint-disable-line camelcase
      active_prev: number; // eslint-disable-line camelcase
      confirmed_sevenDays: number; // eslint-disable-line camelcase
      released_sevenDays: number; // eslint-disable-line camelcase
      death_sevenDays: number; // eslint-disable-line camelcase
      confirmed_eightDays: number; // eslint-disable-line camelcase
      released_eightDays: number; // eslint-disable-line camelcase
      death_eightDays: number; // eslint-disable-line camelcase
    }[];
  };
  chartForDomestic: {
    [key in Exclude<typeof disaster.disasterRegion[number], '전국'> ]: Status;
  } & {
    date: string[]
  };
  chartForGlobal: {
    KR: Status;
    global: Status;
  };
  i18nAll: {
    [language in 'en' | 'ja' | 'ko' | 'zh-Hans' | 'zh-Hant']: {
      [key: string]: string;
    };
  };
  mers: never;
  sars: never;
  statDomesticNow: {
    region: string;
    active: number;
    active_prev: number; // eslint-disable-line camelcase
    confirmed: number;
    confirmed_prev: number; // eslint-disable-line camelcase
    death: number;
    death_prev: number; // eslint-disable-line camelcase
    released: number;
    released_prev: number; // eslint-disable-line camelcase
  }[];
  statGlobalNow: {
    cc: string;
    confirmed: number;
    death: number;
    released: number;
    tested: number;
    critical: string;
    testing: number | null;
    negative: number | null;
    active: number;
    confirmed_prev: number; // eslint-disable-line camelcase
    death_prev: number; // eslint-disable-line camelcase
    testing_prev: number | null; // eslint-disable-line camelcase
    negative_prev: number | null; // eslint-disable-line camelcase
    released_prev: number; // eslint-disable-line camelcase
    active_prev: number; // eslint-disable-line camelcase
    tested_prev: number; // eslint-disable-line camelcase
    critical_prev: string; // eslint-disable-line camelcase
    confirmed_xest: number; // eslint-disable-line camelcase
    death_xest: number; // eslint-disable-line camelcase
    testing_xest: number | null; // eslint-disable-line camelcase
    negative_xest: number | null; // eslint-disable-line camelcase
    released_xest: number; // eslint-disable-line camelcase
    active_xest: number; // eslint-disable-line camelcase
    tested_xest: number; // eslint-disable-line camelcase
    critical_xest: string; // eslint-disable-line camelcase
    population: number;
    incidence: number;
    flag: string;
  }[];
}
