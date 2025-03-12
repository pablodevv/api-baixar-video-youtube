# Use uma imagem Node.js como base
FROM node:18

# Defina o diretório de trabalho no container
WORKDIR /app

# Copie os arquivos package.json e package-lock.json (se existir)
COPY package*.json ./

# Instale as dependências do Node.js
RUN npm install

# Instale as dependências do Chromium e Puppeteer
RUN apt-get update && apt-get install -y \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libpango-1.0-0 \
    libasound2 \
    fonts-liberation \
    ca-certificates \
    fonts-noto \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-arabeyes \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libxkbcommon-x11-0 \
    chromium

# Instale as dependências do puppeteer-extra, puppeteer-extra-plugin-stealth e user-agents
RUN npm install puppeteer-extra puppeteer-extra-plugin-stealth user-agents

# Copie o restante dos arquivos do aplicativo
COPY . .

# Exponha a porta em que o aplicativo será executado
EXPOSE 8100

# Comando para iniciar o aplicativo diretamente
CMD ["node", "index.js"]
