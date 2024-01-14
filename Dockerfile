FROM node:lts-alpine

WORKDIR /app/tianji

RUN npm install -g pnpm@8.3.1

COPY . .

RUN apk add --update --no-cache python3 g++ make py3-pip

# Push client(only support pure text message)
RUN pip install apprise --break-system-packages

RUN pnpm install --frozen-lockfile

RUN pnpm build

# remove unused source file
RUN rm -rf ./src
RUN rm -rf ./website
RUN rm -rf ./reporter

EXPOSE 12345

CMD ["pnpm", "start:docker"]
