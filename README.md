# YouTube Transcript API – Extração de Transcrições

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge&logo=node.js) 
![Puppeteer](https://img.shields.io/badge/Puppeteer-Web%20Scraping-blue?style=for-the-badge&logo=puppeteer) 
![Docker](https://img.shields.io/badge/Docker-Containerized-blue?style=for-the-badge&logo=docker)
![Express](https://img.shields.io/badge/Express-4.x-black?style=for-the-badge&logo=express) 
![Render](https://img.shields.io/badge/Render-Cloud-blue?style=for-the-badge&logo=render)

---

## Introdução

Bem-vindo à **YouTube Transcript API**!  
Esta API foi desenvolvida em **Node.js** para extrair automaticamente transcrições de vídeos do YouTube em tempo real, utilizando **Puppeteer** para web scraping e **Cheerio** para parsing HTML.

Com ela, você poderá:

- Extrair **transcrições completas** de qualquer vídeo do YouTube.  
- Obter texto limpo e formatado em **tempo real**.  
- Integrar facilmente com **sistemas de IA** e análise de conteúdo.  
- Rodar em **containers Docker** para máxima portabilidade.
- **Deploy rápido** em plataformas cloud como Render.

---

## O que é a YouTube Transcript API?

A **YouTube Transcript API** é um serviço que automatiza a extração de transcrições de vídeos do YouTube através de web scraping inteligente. Ela utiliza o site youtubetotranscript.com como fonte e processa o conteúdo para entregar texto limpo via API REST.

### Principais Funcionalidades
- **Extração automática** de transcrições via ID do vídeo.  
- **Processamento inteligente** com remoção de elementos desnecessários.  
- **Otimização de performance** com bloqueio de recursos não essenciais.  
- **Respostas em JSON** estruturadas e limpas.
- **Containerização completa** para desenvolvimento e produção.

---

## Passo a Passo de Configuração

### Método 1: Configuração com Docker (Recomendado)

#### Pré-requisitos
- Docker e Docker Compose instalados
- Conexão com a internet

#### Passo 1 – Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/youtube-transcript-api.git
cd youtube-transcript-api
```

#### Passo 2 – Configurar Docker
Crie o arquivo `.env`:

```env
NODE_ENV=production
PORT=8100
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

#### Passo 3 – Executar com Docker Compose
```bash
docker-compose up -d
```

#### Passo 4 – Testar a API
```bash
curl "http://localhost:8100/get-transcript?videoId=dQw4w9WgXcQ"
```

#### Dockerfile
```dockerfile
FROM node:18-alpine

# Instalar dependências do Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Configurar Puppeteer para usar Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs

EXPOSE 8100

CMD ["node", "server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  youtube-transcript-api:
    build: .
    ports:
      - "8100:8100"
    environment:
      - NODE_ENV=production
      - PORT=8100
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8100/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    mem_limit: 1g
    cpu_count: 1
```

---

### Método 2: Configuração Manual

#### Passo 1 – Instalar dependências
```bash
git clone https://github.com/seu-usuario/youtube-transcript-api.git
cd youtube-transcript-api
npm install
```

#### Passo 2 – Executar localmente
```bash
node server.js
```

---

## Deploy no Render

### Passo 1 – Configurar o serviço
1. Crie um serviço web no Render.
2. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**: 
     ```
     NODE_ENV=production
     PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
     ```

### Passo 2 – Deploy
Clique em Deploy e aguarde a finalização.

> Importante: O Render pode levar alguns minutos para instalar o Chromium na primeira execução.

---

## Exemplos de Uso

### Extrair Transcrição Básica

```bash
# Exemplo com vídeo do YouTube
GET /get-transcript?videoId=dQw4w9WgXcQ

# Resposta JSON
{
  "transcription": "We're no strangers to love You know the rules and so do I..."
}
```

### Casos de Uso Reais

#### Tutorial Educativo
```bash
# Extrair transcrição de tutorial de programação
curl "https://sua-api.onrender.com/get-transcript?videoId=TUTORIAL_VIDEO_ID"
```

#### Análise de Conteúdo
```bash
# Extrair para análise de sentimento
curl "https://sua-api.onrender.com/get-transcript?videoId=REVIEW_VIDEO_ID" | jq '.transcription'
```

#### Integração com IA
```javascript
// Exemplo de integração com OpenAI
const response = await fetch(`/get-transcript?videoId=${videoId}`);
const data = await response.json();

const summary = await openai.createCompletion({
  model: "gpt-3.5-turbo",
  prompt: `Resuma este conteúdo: ${data.transcription}`,
  max_tokens: 150
});
```

### Testando a API

**Localmente:**
```bash
curl "http://localhost:8100/get-transcript?videoId=dQw4w9WgXcQ"
```

**No Render:**
```bash
curl "https://seuprojeto.onrender.com/get-transcript?videoId=dQw4w9WgXcQ"
```

---

## Estrutura da Resposta

### Sucesso (200)
```json
{
  "transcription": "Texto completo da transcrição do vídeo..."
}
```

### Erro - VideoId não fornecido (400)
```json
{
  "error": "Por favor, forneça o videoId na query string."
}
```

### Erro - Falha na extração (500)
```json
{
  "error": "Erro ao extrair a transcrição."
}
```

---

## Comandos Docker Úteis

```bash
# Build da imagem
docker build -t youtube-transcript-api .

# Executar container
docker run -d -p 8100:8100 --env-file .env youtube-transcript-api

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Rebuild e restart
docker-compose up -d --build

# Limpar recursos Docker
docker system prune -a
```

---

## Monitoramento e Saúde

### Endpoint de Health Check
```javascript
// Adicione este endpoint ao server.js
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Métricas de Performance
```javascript
// Exemplo de middleware para logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});
```

---

## Boas Práticas de Segurança

> **Atenção**: Esta API faz web scraping de terceiros. Considere implementar:
> - **Rate limiting** para evitar sobrecarga
> - **Cache** para reduzir requisições repetidas
> - **Validação rigorosa** do videoId
> - **Monitoramento** de uso e erros

### Implementando Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});

app.use('/get-transcript', limiter);
```

### Cache Redis (Opcional)
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache por 1 hora
app.get('/get-transcript', async (req, res) => {
  const videoId = req.query.videoId;
  const cacheKey = `transcript:${videoId}`;
  
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json({ transcription: cached });
  }
  
  // ... resto da lógica
  await client.setex(cacheKey, 3600, transcript);
});
```

---

## Troubleshooting

### Problemas Comuns

#### Puppeteer não encontra Chromium
```bash
# Verificar se Chromium está instalado no container
docker exec -it container_name which chromium-browser

# Rebuild com dependências
docker-compose up -d --build
```

#### Timeout na extração
```javascript
// Aumentar timeouts no código
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForSelector('span.transcript-segment', { timeout: 120000 });
```

#### Memory limit exceeded
```yaml
# No docker-compose.yml
services:
  youtube-transcript-api:
    # ... outras configs
    mem_limit: 2g
    shm_size: 512m
```

#### API não responde
```bash
# Verificar logs
docker-compose logs youtube-transcript-api

# Verificar processo
docker-compose ps

# Restart do serviço
docker-compose restart
```

---

## Otimizações de Performance

### Puppeteer Otimizado
```javascript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-extensions',
    '--no-first-run'
  ],
  timeout: 60000,
});
```

### Blocklist de Recursos
```javascript
const blockedResourceTypes = ['image', 'stylesheet', 'font', 'media'];
const blockedDomains = ['google-analytics.com', 'googletagmanager.com'];

page.on('request', request => {
  if (
    blockedResourceTypes.includes(request.resourceType()) ||
    blockedDomains.some(domain => request.url().includes(domain))
  ) {
    request.abort();
  } else {
    request.continue();
  }
});
```

---

## Considerações de Uso

### Limitações
- Dependente do site terceiro youtubetotranscript.com
- Pode ter variações de performance baseadas na carga da rede
- Videos muito longos podem demorar mais para processar
- Nem todos os vídeos possuem transcrições disponíveis

### Casos de Uso Recomendados
- **Análise de conteúdo** educativo e informativo
- **Integração com sistemas de IA** para summarização
- **Acessibilidade** para pessoas com deficiência auditiva
- **Pesquisa e indexação** de conteúdo em vídeo
- **Criação de legendas** customizadas

---

## Estrutura do Projeto

```
youtube-transcript-api/
├── server.js              # Servidor principal
├── package.json           # Dependências Node.js
├── Dockerfile            # Configuração Docker
├── docker-compose.yml    # Orquestração de containers
├── .env.example         # Exemplo de variáveis de ambiente
├── .dockerignore        # Arquivos ignorados pelo Docker
├── healthcheck.js       # Script de verificação de saúde
└── README.md           # Este arquivo
```

---

## Roadmap

- [ ] Implementar cache Redis para otimização
- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Rate limiting configurável
- [ ] Dashboard de métricas
- [ ] Webhooks para notificações
- [ ] Testes automatizados
- [ ] Documentação OpenAPI/Swagger

---

**Transformando vídeos em texto, uma transcrição por vez.**

---

Desenvolvido com foco em **performance, simplicidade e confiabilidade**  
Feito com 💻 + ☕ por [Pablo Rodriguez](https://github.com/pablodevv)
