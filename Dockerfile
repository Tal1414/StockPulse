FROM node:20-slim

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY python/requirements.txt /app/python/requirements.txt
RUN pip3 install --break-system-packages -r /app/python/requirements.txt

WORKDIR /app

# Copy all source
COPY . .

# Build frontend and install server deps
RUN cd client && npm install && npm run build
RUN cd server && npm install

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server/index.js"]
