# Optional: docker build -t taskboard .
#          docker run -p 3000:3000 taskboard
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["npm","start"]
