# Use uma imagem Node.js como base
FROM node:18

# Defina o diretório de trabalho no container
WORKDIR /app

# Copie os arquivos package.json e package-lock.json
COPY package*.json ./

# Instale todas as dependências do projeto
RUN npm install

# Instale dependências do Chromium e Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxrandr2 \
    xdg-utils \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório para downloads temporários
RUN mkdir -p /app/downloads

# Copie o restante dos arquivos do aplicativo
COPY . .

# Definir variável de ambiente para Puppeteer usar o Chromium instalado no sistema
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Exponha a porta do aplicativo
EXPOSE 8100

# Comando para iniciar o aplicativo
CMD ["node", "index.js"]
