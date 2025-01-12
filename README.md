# Smart Meter

**Smart Meter** é um projeto de IoT e mobile voltado para monitoramento de consumo energético. Desenvolvido como parte de um TCC, ele combina um protótipo físico, uma aplicação móvel e um servidor FIWARE.

## Estrutura do Repositório

```
smart-meter/

 ├── aplicativo-movel/ # Aplicação móvel desenvolvida com Ionic, Angular, TypeScript e Capacitor
 ├── prototipo-esp32/ # Código fonte do protótipo desenvolvido na IDE Arduino para ESP32
 ├── servidor-fiware/ # Configuração do servidor FIWARE com Docker
```
### 1. Aplicativo Móvel
A pasta `aplicativo-movel` contém o código fonte de uma aplicação que:
- Monitora consumo de energia em tempo real.
- Mostra gráficos detalhados de consumo.
- Oferece limites configuráveis e modos de visualização.

#### Tecnologias utilizadas:
- **Framework:** Ionic + Angular
- **Linguagem:** TypeScript
- **Capacitor:** APIs nativas do dispositivo

### 2. Protótipo ESP32
A pasta `prototipo-esp32` contém o código do protótipo que:
- Coleta dados elétricos (tensão, corrente, potência).
- Transmite informações via Wi-Fi para o servidor FIWARE app móvel.
- Desenvolvido na **Arduino IDE**.

#### Tecnologias utilizadas:
- **Hardware:** ESP32
- **Linguagem:** C/C++
- **Bibliotecas:** Drivers para sensores e comunicação.

### 3. Servidor FIWARE
A pasta `servidor-fiware` contém a configuração do servidor FIWARE, usado para:
- Gerenciar e armazenar os dados coletados pelo protótipo.
- Integrar os dados com a aplicação móvel via APIs REST.

#### Estrutura:
```
servidor-fiware/
 ├── docker-compose.yml # Configuração dos contêineres Docker
 ├── config/ │
  └── localhost.env # Variáveis de ambiente
  └── nginx.conf # Configuração do servidor NGINX
```

#### Tecnologias utilizadas:
- **FIWARE**: Orion Context Broker, STH-Comet, QuantumLeap, iotagent-json
- **Docker**: Gerenciamento de contêineres
- **NGINX**: Servidor proxy reverso

## Como Executar

### 1. Configuração do Protótipo ESP32
1. Clone o repositório:
   ```bash
   git clone https://github.com/AlissonWeiss/smart-meter.git
   cd smart-meter/prototipo-esp32
   ```
2. Abra os arquivos na Arduino IDE.
3. Configure os pinos e sensores no código, se necessário.
4. Compile e faça upload para o ESP32.

### 2. Execução da Aplicação Móvel
1. Acesse a pasta da aplicação:
   ```bash
   cd smart-meter/aplicativo-movel
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute a aplicação:
   ```bash
   ionic serve
   ```

### 3. Inicialização do Servidor FIWARE
1. Acesse a pasta do servidor:
   ```bash
   cd smart-meter/servidor-fiware
   ```
2. Configure as variáveis de ambiente no arquivo ***config/localhost.env***:
   
3. Inicie os containers Docker:
   ```bash
   docker compose --env-file config/localhost.env up --build -d --remove-orphans
   ```

## Funcionalidades
* Monitoramento em tempo real de consumo energético.
* Definição de limites diário, semanal e mensal.
* Visualização de consumo acumulado ou por períodos específicos.
* Gerenciamento de dados com FIWARE e APIs REST.
