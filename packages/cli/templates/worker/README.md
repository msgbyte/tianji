# Tianji Worker

This is a Tianji Worker project created by the Tianji CLI.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Build the worker:
```bash
npm run build
```

3. Deploy to Tianji:
```bash
tianji worker deploy
```

## Development

The worker code is located in `src/index.ts`. You can modify it to suit your needs.

The main handler function receives two parameters:
- `payload`: The request payload (query params + body)
- `context`: The request context (type, request info)

## Configuration

The `.tianjirc` file contains the project configuration:
- `name`: The worker name
- `workerId`: The worker ID (auto-generated after first deployment)

## Learn More

Visit [Tianji Documentation](https://tianji.msgbyte.com/docs) to learn more about workers.
