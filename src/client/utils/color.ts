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
];
export function pickColorWithStr(str: string) {
  return colors[str2int(str) % colors.length];
}
export function pickColorWithNum(num: number) {
  return colors[num % colors.length];
}
