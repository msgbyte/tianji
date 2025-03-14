import str2int from 'str2int';

const colors = [
  '#3F51B5',
  '#F44336',
  '#9C27B0',
  '#FFEB3B',
  '#03A9F4',
  '#673AB7',
  '#009688',
  '#CDDC39',
  '#8BC34A',
  '#E91E63',
  '#FFC107',
  '#00BCD4',
  '#2196F3',
  '#FF5722',
  '#4CAF50',
  '#FF9800',
  '#795548',
  '#607D8B',
  '#9E9E9E',
  '#FFB6C1',
  '#87CEEB',
  '#DDA0DD',
  '#F0E68C',
  '#98FB98',
  '#B0C4DE',
  '#FFE4B5',
  '#20B2AA',
  '#FF69B4',
  '#7B68EE',
  '#32CD32',
];
export function pickColorWithStr(str: string) {
  return colors[str2int(str) % colors.length];
}
export function pickColorWithNum(num: number) {
  return colors[num % colors.length];
}
