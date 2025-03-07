# Use uma imagem base do Node.js (alpine é uma imagem mais leve, mas você pode usar outra se preferir)
FROM node:16

# Instala o Python e pip para usar na instalação do yt-dlp
RUN apt-get update && apt-get install -y python3 python3-pip

# Instala o yt-dlp usando o pip
RUN pip3 install yt-dlp

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos do repositório para o container
COPY . .

# Instala as dependências do Node.js
RUN npm install

# Expõe a porta que o servidor irá rodar
EXPOSE 8100

# Comando para iniciar o servidor
CMD ["node", "index.js"]
