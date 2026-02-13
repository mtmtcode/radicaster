export interface RadikoArea {
  id: string;
  name: string;
}

export interface RadikoStation {
  id: string;
  name: string;
  areaId: string;
}

export const RADIKO_AREAS: RadikoArea[] = [
  {
    "id": "JP1",
    "name": "北海道"
  },
  {
    "id": "JP2",
    "name": "青森県"
  },
  {
    "id": "JP3",
    "name": "岩手県"
  },
  {
    "id": "JP4",
    "name": "宮城県"
  },
  {
    "id": "JP5",
    "name": "秋田県"
  },
  {
    "id": "JP6",
    "name": "山形県"
  },
  {
    "id": "JP7",
    "name": "福島県"
  },
  {
    "id": "JP8",
    "name": "茨城県"
  },
  {
    "id": "JP9",
    "name": "栃木県"
  },
  {
    "id": "JP10",
    "name": "群馬県"
  },
  {
    "id": "JP11",
    "name": "埼玉県"
  },
  {
    "id": "JP12",
    "name": "千葉県"
  },
  {
    "id": "JP13",
    "name": "東京都"
  },
  {
    "id": "JP14",
    "name": "神奈川県"
  },
  {
    "id": "JP15",
    "name": "新潟県"
  },
  {
    "id": "JP16",
    "name": "富山県"
  },
  {
    "id": "JP17",
    "name": "石川県"
  },
  {
    "id": "JP18",
    "name": "福井県"
  },
  {
    "id": "JP19",
    "name": "山梨県"
  },
  {
    "id": "JP20",
    "name": "長野県"
  },
  {
    "id": "JP21",
    "name": "岐阜県"
  },
  {
    "id": "JP22",
    "name": "静岡県"
  },
  {
    "id": "JP23",
    "name": "愛知県"
  },
  {
    "id": "JP24",
    "name": "三重県"
  },
  {
    "id": "JP25",
    "name": "滋賀県"
  },
  {
    "id": "JP26",
    "name": "京都府"
  },
  {
    "id": "JP27",
    "name": "大阪府"
  },
  {
    "id": "JP28",
    "name": "兵庫県"
  },
  {
    "id": "JP30",
    "name": "和歌山県"
  },
  {
    "id": "JP31",
    "name": "鳥取県"
  },
  {
    "id": "JP32",
    "name": "島根県"
  },
  {
    "id": "JP33",
    "name": "岡山県"
  },
  {
    "id": "JP34",
    "name": "広島県"
  },
  {
    "id": "JP35",
    "name": "山口県"
  },
  {
    "id": "JP36",
    "name": "徳島県"
  },
  {
    "id": "JP37",
    "name": "香川県"
  },
  {
    "id": "JP38",
    "name": "愛媛県"
  },
  {
    "id": "JP39",
    "name": "高知県"
  },
  {
    "id": "JP40",
    "name": "福岡県"
  },
  {
    "id": "JP41",
    "name": "佐賀県"
  },
  {
    "id": "JP42",
    "name": "長崎県"
  },
  {
    "id": "JP43",
    "name": "熊本県"
  },
  {
    "id": "JP44",
    "name": "大分県"
  },
  {
    "id": "JP45",
    "name": "宮崎県"
  },
  {
    "id": "JP46",
    "name": "鹿児島県"
  },
  {
    "id": "JP47",
    "name": "沖縄県"
  }
];

export const RADIKO_STATIONS: RadikoStation[] = [
  {
    "id": "HBC",
    "name": "ＨＢＣラジオ",
    "areaId": "JP1"
  },
  {
    "id": "STV",
    "name": "ＳＴＶラジオ",
    "areaId": "JP1"
  },
  {
    "id": "AIR-G",
    "name": "AIR-G'（FM北海道）",
    "areaId": "JP1"
  },
  {
    "id": "NORTHWAVE",
    "name": "FM NORTH WAVE",
    "areaId": "JP1"
  },
  {
    "id": "RAB",
    "name": "ＲＡＢ青森放送",
    "areaId": "JP2"
  },
  {
    "id": "AFB",
    "name": "エフエム青森",
    "areaId": "JP2"
  },
  {
    "id": "IBC",
    "name": "IBCラジオ",
    "areaId": "JP3"
  },
  {
    "id": "FMI",
    "name": "エフエム岩手",
    "areaId": "JP3"
  },
  {
    "id": "TBC",
    "name": "TBCラジオ",
    "areaId": "JP4"
  },
  {
    "id": "DATEFM",
    "name": "Date fm エフエム仙台",
    "areaId": "JP4"
  },
  {
    "id": "ABS",
    "name": "ＡＢＳ秋田放送",
    "areaId": "JP5"
  },
  {
    "id": "AFM",
    "name": "エフエム秋田",
    "areaId": "JP5"
  },
  {
    "id": "YBC",
    "name": "YBC山形放送",
    "areaId": "JP6"
  },
  {
    "id": "RFM",
    "name": "Rhythm Station　エフエム山形",
    "areaId": "JP6"
  },
  {
    "id": "RFC",
    "name": "RFCラジオ福島",
    "areaId": "JP7"
  },
  {
    "id": "FMF",
    "name": "ふくしまFM",
    "areaId": "JP7"
  },
  {
    "id": "JOIK",
    "name": "NHKラジオ第1（札幌）",
    "areaId": "JP1"
  },
  {
    "id": "JOHK",
    "name": "NHKラジオ第1（仙台）",
    "areaId": "JP4"
  },
  {
    "id": "TBS",
    "name": "TBSラジオ",
    "areaId": "JP13"
  },
  {
    "id": "QRR",
    "name": "文化放送",
    "areaId": "JP13"
  },
  {
    "id": "LFR",
    "name": "ニッポン放送",
    "areaId": "JP13"
  },
  {
    "id": "INT",
    "name": "interfm",
    "areaId": "JP13"
  },
  {
    "id": "FMT",
    "name": "TOKYO FM",
    "areaId": "JP13"
  },
  {
    "id": "FMJ",
    "name": "J-WAVE",
    "areaId": "JP13"
  },
  {
    "id": "JORF",
    "name": "ラジオ日本",
    "areaId": "JP13"
  },
  {
    "id": "BAYFM78",
    "name": "BAYFM78",
    "areaId": "JP12"
  },
  {
    "id": "NACK5",
    "name": "NACK5",
    "areaId": "JP11"
  },
  {
    "id": "YFM",
    "name": "ＦＭヨコハマ",
    "areaId": "JP14"
  },
  {
    "id": "IBS",
    "name": "LuckyFM 茨城放送",
    "areaId": "JP8"
  },
  {
    "id": "CRT",
    "name": "CRT栃木放送",
    "areaId": "JP9"
  },
  {
    "id": "RADIOBERRY",
    "name": "RADIO BERRY",
    "areaId": "JP9"
  },
  {
    "id": "FMGUNMA",
    "name": "FM GUNMA",
    "areaId": "JP10"
  },
  {
    "id": "JOAK",
    "name": "NHKラジオ第1（東京）",
    "areaId": "JP13"
  },
  {
    "id": "BSN",
    "name": "ＢＳＮラジオ",
    "areaId": "JP15"
  },
  {
    "id": "FMNIIGATA",
    "name": "FM NIIGATA",
    "areaId": "JP15"
  },
  {
    "id": "KNB",
    "name": "ＫＮＢラジオ",
    "areaId": "JP16"
  },
  {
    "id": "FMTOYAMA",
    "name": "ＦＭとやま",
    "areaId": "JP16"
  },
  {
    "id": "MRO",
    "name": "MROラジオ",
    "areaId": "JP17"
  },
  {
    "id": "HELLOFIVE",
    "name": "エフエム石川",
    "areaId": "JP17"
  },
  {
    "id": "FBC",
    "name": "FBCラジオ",
    "areaId": "JP18"
  },
  {
    "id": "FMFUKUI",
    "name": "FM福井",
    "areaId": "JP18"
  },
  {
    "id": "YBS",
    "name": "ＹＢＳラジオ",
    "areaId": "JP19"
  },
  {
    "id": "FM-FUJI",
    "name": "FM FUJI",
    "areaId": "JP19"
  },
  {
    "id": "SBC",
    "name": "SBCラジオ",
    "areaId": "JP20"
  },
  {
    "id": "FMN",
    "name": "ＦＭ長野",
    "areaId": "JP20"
  },
  {
    "id": "CBC",
    "name": "CBCラジオ",
    "areaId": "JP23"
  },
  {
    "id": "TOKAIRADIO",
    "name": "TOKAI RADIO",
    "areaId": "JP23"
  },
  {
    "id": "GBS",
    "name": "ぎふチャン",
    "areaId": "JP21"
  },
  {
    "id": "ZIP-FM",
    "name": "ZIP-FM",
    "areaId": "JP23"
  },
  {
    "id": "FMAICHI",
    "name": "FM AICHI",
    "areaId": "JP23"
  },
  {
    "id": "FMGIFU",
    "name": "ＦＭ ＧＩＦＵ",
    "areaId": "JP21"
  },
  {
    "id": "SBS",
    "name": "SBSラジオ",
    "areaId": "JP22"
  },
  {
    "id": "K-MIX",
    "name": "K-MIX",
    "areaId": "JP22"
  },
  {
    "id": "FMMIE",
    "name": "レディオキューブ ＦＭ三重",
    "areaId": "JP24"
  },
  {
    "id": "JOCK",
    "name": "NHKラジオ第1（名古屋）",
    "areaId": "JP23"
  },
  {
    "id": "ABC",
    "name": "ABCラジオ",
    "areaId": "JP27"
  },
  {
    "id": "MBS",
    "name": "MBSラジオ",
    "areaId": "JP27"
  },
  {
    "id": "OBC",
    "name": "OBCラジオ大阪",
    "areaId": "JP27"
  },
  {
    "id": "CCL",
    "name": "FM COCOLO",
    "areaId": "JP27"
  },
  {
    "id": "802",
    "name": "FM802",
    "areaId": "JP27"
  },
  {
    "id": "FMO",
    "name": "FM大阪",
    "areaId": "JP27"
  },
  {
    "id": "KISSFMKOBE",
    "name": "Kiss FM KOBE",
    "areaId": "JP28"
  },
  {
    "id": "CRK",
    "name": "ラジオ関西",
    "areaId": "JP28"
  },
  {
    "id": "E-RADIO",
    "name": "e-radio FM滋賀",
    "areaId": "JP25"
  },
  {
    "id": "KBS",
    "name": "KBS京都ラジオ",
    "areaId": "JP26"
  },
  {
    "id": "ALPHA-STATION",
    "name": "α-STATION FM KYOTO",
    "areaId": "JP26"
  },
  {
    "id": "WBS",
    "name": "wbs和歌山放送",
    "areaId": "JP30"
  },
  {
    "id": "JOBK",
    "name": "NHKラジオ第1（大阪）",
    "areaId": "JP27"
  },
  {
    "id": "BSS",
    "name": "BSSラジオ",
    "areaId": "JP31"
  },
  {
    "id": "FM-SANIN",
    "name": "エフエム山陰",
    "areaId": "JP32"
  },
  {
    "id": "RSK",
    "name": "ＲＳＫラジオ",
    "areaId": "JP33"
  },
  {
    "id": "FM-OKAYAMA",
    "name": "ＦＭ岡山",
    "areaId": "JP33"
  },
  {
    "id": "RCC",
    "name": "RCCラジオ",
    "areaId": "JP34"
  },
  {
    "id": "HFM",
    "name": "広島FM",
    "areaId": "JP34"
  },
  {
    "id": "KRY",
    "name": "ＫＲＹ山口放送",
    "areaId": "JP35"
  },
  {
    "id": "FMY",
    "name": "エフエム山口",
    "areaId": "JP35"
  },
  {
    "id": "JRT",
    "name": "ＪＲＴ四国放送",
    "areaId": "JP36"
  },
  {
    "id": "FM807",
    "name": "FM徳島",
    "areaId": "JP36"
  },
  {
    "id": "RNC",
    "name": "RNC西日本放送",
    "areaId": "JP37"
  },
  {
    "id": "FMKAGAWA",
    "name": "エフエム香川",
    "areaId": "JP37"
  },
  {
    "id": "RNB",
    "name": "RNB南海放送",
    "areaId": "JP38"
  },
  {
    "id": "JOEU-FM",
    "name": "FM愛媛",
    "areaId": "JP38"
  },
  {
    "id": "RKC",
    "name": "RKC高知放送",
    "areaId": "JP39"
  },
  {
    "id": "HI-SIX",
    "name": "エフエム高知",
    "areaId": "JP39"
  },
  {
    "id": "JOFK",
    "name": "NHKラジオ第1（広島）",
    "areaId": "JP34"
  },
  {
    "id": "JOZK",
    "name": "NHKラジオ第1（松山）",
    "areaId": "JP38"
  },
  {
    "id": "RKB",
    "name": "RKBラジオ",
    "areaId": "JP40"
  },
  {
    "id": "KBC",
    "name": "KBCラジオ",
    "areaId": "JP40"
  },
  {
    "id": "LOVEFM",
    "name": "LOVE FM",
    "areaId": "JP40"
  },
  {
    "id": "CROSSFM",
    "name": "CROSS FM",
    "areaId": "JP40"
  },
  {
    "id": "FMFUKUOKA",
    "name": "FM FUKUOKA",
    "areaId": "JP40"
  },
  {
    "id": "FMS",
    "name": "エフエム佐賀",
    "areaId": "JP41"
  },
  {
    "id": "NBC",
    "name": "NBCラジオ",
    "areaId": "JP42"
  },
  {
    "id": "FMNAGASAKI",
    "name": "FM長崎",
    "areaId": "JP42"
  },
  {
    "id": "RKK",
    "name": "RKKラジオ",
    "areaId": "JP43"
  },
  {
    "id": "FMK",
    "name": "FMKエフエム熊本",
    "areaId": "JP43"
  },
  {
    "id": "OBS",
    "name": "OBSラジオ",
    "areaId": "JP44"
  },
  {
    "id": "FM_OITA",
    "name": "エフエム大分",
    "areaId": "JP44"
  },
  {
    "id": "MRT",
    "name": "宮崎放送",
    "areaId": "JP45"
  },
  {
    "id": "JOYFM",
    "name": "エフエム宮崎",
    "areaId": "JP45"
  },
  {
    "id": "MBC",
    "name": "ＭＢＣラジオ",
    "areaId": "JP46"
  },
  {
    "id": "MYUFM",
    "name": "μＦＭ",
    "areaId": "JP46"
  },
  {
    "id": "RBC",
    "name": "RBCiラジオ",
    "areaId": "JP47"
  },
  {
    "id": "ROK",
    "name": "ラジオ沖縄",
    "areaId": "JP47"
  },
  {
    "id": "FM_OKINAWA",
    "name": "FM沖縄",
    "areaId": "JP47"
  },
  {
    "id": "JOLK",
    "name": "NHKラジオ第1（福岡）",
    "areaId": "JP40"
  },
  {
    "id": "RN1",
    "name": "ラジオNIKKEI第1",
    "areaId": "JP13"
  },
  {
    "id": "RN2",
    "name": "ラジオNIKKEI第2",
    "areaId": "JP13"
  },
  {
    "id": "JOAK-FM",
    "name": "NHK-FM（東京）",
    "areaId": "JP13"
  }
];

export const DEFAULT_AREA_ID = "JP13";

