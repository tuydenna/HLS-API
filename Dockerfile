FROM node:20.9.0-alpine

WORKDIR /app

#COPY package*.json ./

COPY . .

RUN apk add --no-cache ffmpeg

RUN ffmpeg -version

RUN npm ci --include=dev

RUN npm run build

CMD ["sh", "-c", "npm run start:production"]