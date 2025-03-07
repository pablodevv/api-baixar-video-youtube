# Use uma imagem base do Ubuntu (para maior compatibilidade)
FROM ubuntu:20.04

# Atualiza o apt e instala o Python 3.8 e dependências
RUN apt-get update && apt-get install -y \
    python3.8 \
    python3.8-dev \
    python3.8-distutils \
    python3-pip \
    curl \
    gnupg \
    lsb-release

# Instalar o Node.js 16.x (a versão do Node que você está usando)
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash - && apt-get install -y nodejs

# Instala o yt-dlp usando o pip3
RUN pip3 install yt-dlp

# Atualiza o yt-dlp para a versão mais recente
RUN yt-dlp -U

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos do repositório para o container
COPY . .

# Copia o arquivo de cookies da raiz do projeto para o diretório no container
COPY cookies.json /app/cookies.json

# Instala as dependências do Node.js
RUN npm install

# Expõe a porta que o servidor irá rodar
EXPOSE 8100

# Comando para iniciar o servidor
CMD ["node", "index.js"]
