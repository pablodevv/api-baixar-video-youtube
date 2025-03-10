FROM python:3.9-slim

# Instala o Python e o pip3
RUN apt-get update && apt-get install -y python3-pip

# Instala o yt-dlp usando o pip3 e garante que está na versão mais recente
RUN pip3 install --upgrade yt-dlp

# Define o diretório de trabalho no container
WORKDIR /app

# Copia o arquivo de cookies para o contêiner
COPY cookies_netscape.txt /app/cookies_netscape.txt

# Copia os arquivos do repositório para o contêiner (ignorando arquivos desnecessários)
COPY . /app

# Limpa o cache do npm para evitar problemas
RUN npm cache clean --force

# Instala as dependências do Node.js
RUN npm install

# Define a variável de ambiente para desabilitar a verificação de atualizações
ENV YTDL_NO_UPDATE=true

# Expõe a porta que o servidor irá rodar
EXPOSE 8100

# Comando para iniciar o servidor
CMD ["node", "index.js"]
