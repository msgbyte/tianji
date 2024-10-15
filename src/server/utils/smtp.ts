export function generateSMTPHTML(body: string) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tianji</title>
    <style>
      img {
        max-width: 100%;
      }
    </style>
  </head>
  <body style="background-color: #fafafa;">
    <div style="width: 640px; margin: auto;">
      <header style="margin-bottom: 10px; padding-top: 10px; text-align: center;">
        <img src="https://tianji.msgbyte.com/img/logo@128.png" width="50" height="50" />
      </header>
      <div style="background-color: #fff; border: 1px solid #dddddd; padding: 36px; margin-bottom: 10px; border-radius: 5px;">
        ${body}
      </div>
      <footer style="text-align: center;">
        <div>
          Sent with ❤ by Tianji.
        </div>
        <div>
          <a href="https://github.com/msgbyte/tianji" target="_blank">Github</a>
        </div>
      </footer>
    </div>
  </body>
  </html>
  `;
}
