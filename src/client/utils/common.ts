import millify from 'millify';

export function parseTime(val: number) {
  const days = ~~(val / 86400);
  const hours = ~~(val / 3600) - days * 24;
  const minutes = ~~(val / 60) - days * 1440 - hours * 60;
  const seconds = ~~val - days * 86400 - hours * 3600 - minutes * 60;
  const ms = (val - ~~val) * 1000;

  return {
    days,
    hours,
    minutes,
    seconds,
    ms,
  };
}

export function formatNumber(n: number): string {
  if (typeof n !== 'number') {
    n = Number(n);
  }

  return millify(n, {
    lowercase: true,
  });
}

export function formatShortTime(val: number, formats = ['m', 's'], space = '') {
  const { days, hours, minutes, seconds, ms } = parseTime(val);
  let t = '';

  if (days > 0 && formats.indexOf('d') !== -1) t += `${days}d${space}`;
  if (hours > 0 && formats.indexOf('h') !== -1) t += `${hours}h${space}`;
  if (minutes > 0 && formats.indexOf('m') !== -1) t += `${minutes}m${space}`;
  if (seconds > 0 && formats.indexOf('s') !== -1) t += `${seconds}s${space}`;
  if (ms > 0 && formats.indexOf('ms') !== -1) t += `${ms}ms`;

  if (!t) {
    return `0${formats[formats.length - 1]}`;
  }

  return t;
}

export function generateRandomString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function numberToLetter(number: number) {
  if (number < 1) {
    number = 1;
  }

  let result = [];
  while (number > 0) {
    number -= 1;
    result.push(String.fromCharCode(65 + (number % 26)));
    number = Math.floor(number / 26);
  }

  return result.reverse().join('');
}
