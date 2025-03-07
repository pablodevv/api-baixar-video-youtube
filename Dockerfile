# Usa uma imagem base com Node.js
FROM node:16

# Instala o yt-dlp
RUN apt-get update && apt-get install -y yt-dlp

# Define o diretório de trabalho no container
WORKDIR /usr/src/app

# Copia os arquivos do seu projeto para dentro do container
COPY . .

# Instala as dependências do Node.js
RUN npm install

# Exponha a porta que seu servidor vai rodar
EXPOSE 8100

# Comando para iniciar o seu servidor
CMD ["node", "index.js"]
