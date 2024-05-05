/**
 * A shortcut for executing directly in the component: stopPropagation
 */
export function stopPropagation(e: Event) {
  e.stopPropagation();
}

/**
 * A shortcut for executing directly in the component: preventDefault
 */
export function preventDefault(e: Event) {
  e.preventDefault();
}

export const rootEl = document.getElementById('root');

export function downloadCSV(csv: string, filename: string): void {
  const fakeLink = document.createElement('a');
  fakeLink.style.display = 'none';
  document.body.appendChild(fakeLink);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  // @ts-ignore
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    // Manage IE11+ & Edge
    // @ts-ignore
    window.navigator.msSaveOrOpenBlob(blob, `${filename}.csv`);
  } else {
    fakeLink.setAttribute('href', URL.createObjectURL(blob));
    fakeLink.setAttribute('download', `${filename}.csv`);
    fakeLink.click();
  }
}
