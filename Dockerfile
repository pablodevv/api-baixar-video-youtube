# Use uma imagem Node.js como base
FROM node:18

# Defina o diretório de trabalho no container
WORKDIR /app

# Copie os arquivos package.json e package-lock.json
COPY package*.json ./

# Instale todas as dependências
RUN npm install

# Instale dependências do Chromium e Puppeteer
RUN apt-get update && apt-get install -y chromium-browser

# Criar diretório para downloads temporários
RUN mkdir -p /app/downloads

# Copie o restante dos arquivos do aplicativo
COPY . .

# Exponha a porta do aplicativo
EXPOSE 8100

# Comando para iniciar o aplicativo
CMD ["node", "index.js"]
