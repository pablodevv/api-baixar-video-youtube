FROM node:16

# Instala o Python, pip3 e o sudo
RUN apt-get update && apt-get install -y python3 python3-pip sudo

# Instala o yt-dlp usando o pip3
RUN sudo pip3 install yt-dlp

# Define o diretório de trabalho no container
WORKDIR /app

# Copia o arquivo de cookies para o contêiner
COPY cookies_netscape.txt /app/cookies_netscape.txt

# Copia os arquivos do repositório para o contêiner (ignorando arquivos desnecessários)
COPY . /app

# Limpa o cache do npm para evitar possíveis problemas de dependências
RUN npm cache clean --force

# Instala as dependências do Node.js
RUN npm install

# Define a variável de ambiente para desabilitar a verificação de atualizações
ENV YTDL_NO_UPDATE=true

# Expõe a porta que o servidor irá rodar
EXPOSE 8100

# Comando para iniciar o servidor
CMD ["node", "index.js"]
