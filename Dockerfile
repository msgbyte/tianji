FROM node:20-alpine

WORKDIR /app/tianji

RUN npm install -g pnpm@8.3.1

COPY . .

RUN apk add --update --no-cache python3 py3-pip g++ make

RUN pnpm install --frozen-lockfile

RUN pnpm build

# make sure run after pnpm build completed to avoid break system packages
# Push client(only support pure text message)
RUN pip install apprise --break-system-packages

# remove unused source file
RUN rm -rf ./src
RUN rm -rf ./website
RUN rm -rf ./reporter

EXPOSE 12345

CMD ["pnpm", "start:docker"]
