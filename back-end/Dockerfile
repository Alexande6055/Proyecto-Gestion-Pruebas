FROM node:20-alpine

WORKDIR /app

# Install dependencies, build and run in production mode
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY . .

RUN npm install
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
