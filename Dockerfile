FROM node:18-bookworm

WORKDIR /app/tianji

RUN npm install -g pnpm@8.3.1

COPY . .

# Push client(only support pure text message)
RUN apt update && apt -y install apprise

RUN pnpm install --frozen-lockfile

RUN pnpm build

# remove unused source file
RUN rm -rf ./src
RUN rm -rf ./website
RUN rm -rf ./reporter

EXPOSE 12345

CMD ["pnpm", "start:docker"]
