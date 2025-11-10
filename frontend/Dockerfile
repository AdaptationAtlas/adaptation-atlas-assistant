FROM node:23-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY *.json ./
COPY *.js ./
COPY *.ts ./
COPY index.html ./
COPY data ./

FROM base AS development
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS production
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]