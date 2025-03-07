# Use uma imagem base do Node.js
FROM node:16

# Instala o Python e o pip3
RUN apt-get update && apt-get install -y python3 python3-pip

# Instala o yt-dlp usando o pip3
RUN pip3 install yt-dlp

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos do repositório para o container
COPY . .

# Copia o arquivo de cookies convertido para Netscape para o diretório no container
COPY cookies_netscape.txt /app/cookies_netscape.txt

# Instala as dependências do Node.js
RUN npm install

# Expõe a porta que o servidor irá rodar
EXPOSE 8100

# Comando para iniciar o servidor
CMD ["node", "index.js"]
