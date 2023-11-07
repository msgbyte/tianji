FROM node:lts-alpine

WORKDIR /app/tianji

RUN npm install -g pnpm@8.3.1

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm build

RUN rm -rf ./src
RUN rm -rf ./website
RUN rm -rf ./reporter

EXPOSE 12345

CMD ["pnpm", "start:docker"]
