# Use uma imagem Node.js como base
FROM node:18

# Defina o diretório de trabalho no container
WORKDIR /app

# Copie os arquivos package.json e package-lock.json (se existir)
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante dos arquivos do aplicativo
COPY . .

# Exponha a porta em que o aplicativo será executado
EXPOSE 8100

# Comando para verificar a versão do Node.js
RUN node -v

# Comando para iniciar o aplicativo diretamente
CMD [ "node", "index.js" ]

# Linha adicionada para forçar a reconstrução
