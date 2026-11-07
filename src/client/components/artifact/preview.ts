// Prepend the viewer policy so uploaded markup cannot relax it with another CSP.
export function createArtifactPreview(source: string): string {
  const policy = [
    "default-src 'none'",
    "script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net/npm/ https://cdn.tailwindcss.com https://code.jquery.com",
    "style-src 'unsafe-inline' https://fonts.googleapis.com",
    'img-src data: blob:',
    'media-src data: blob:',
    'font-src data: https://fonts.gstatic.com',
    "connect-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  return `<!doctype html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer"></head>${source}`;
}
