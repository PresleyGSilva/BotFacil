const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); // Para fazer requisições HTTP
require('dotenv').config();

let client;
let responses = []; // Armazena as mensagens configuradas

// Chave de API da OpenAI
const OPENAI_API_KEY = "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"; // Coloque sua chave de API aqui

// Função para fazer a requisição para a OpenAI GPT-3
async function queryOpenAI(message) {
    const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "text-davinci-003", // Escolha o modelo adequado
            prompt: `
                Você é um assistente virtual de vendas de uma plataforma de streaming. Sua tarefa é responder de maneira amigável, envolvente e com foco na venda do serviço. Responda como se estivesse ajudando um cliente a escolher o melhor plano de assinatura de streaming. Sempre mantenha uma abordagem focada no cliente, destacando os benefícios do serviço, respondendo dúvidas sobre planos, custos, funcionalidades, etc. 
                Caso o cliente mostre interesse, forneça informações claras sobre os planos de assinatura e faça a venda de forma natural e cordial. 
                O cliente pergunta: "${message}"
            `,
            max_tokens: 150,
            temperature: 0.7,  // Ajuste o valor de temperatura para controlar a criatividade
        })
    });

    const data = await response.json();
    return data.choices ? data.choices[0].text.trim() : "Desculpe, não consegui processar sua solicitação.";
}

exports.startClient = (mainWindow) => {
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { headless: true },
    });

    // Carrega mensagens configuradas de um arquivo JSON
    const loadResponses = () => {
        const configPath = path.join(__dirname, 'config.json');
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            responses = JSON.parse(configData).responses || [];
        } else {
            console.error('Arquivo config.json não encontrado.');
        }
    };

    loadResponses();

    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error('Erro ao gerar o QR Code:', err);
                return;
            }

            console.log('QR Code gerado com sucesso!');
            console.log(url); // Veja a URL base64 gerada para o QR Code

            mainWindow.webContents.send('qr-code', url);
        });
    });

    client.on('ready', () => {
        console.log('WhatsApp está pronto!');
        mainWindow.webContents.send('status', 'Conectado');
    });

    client.on('message', async (msg) => {
        console.log(`Mensagem recebida: ${msg.body}`); // Log para debug

        const normalizedMessage = msg.body.toLowerCase().trim(); // Normaliza a mensagem

        // Verifica os gatilhos configurados
        let responseFound = false;

        responses.forEach((response) => {
            const normalizedTrigger = response.trigger.toLowerCase().trim();

            if (normalizedMessage.includes(normalizedTrigger)) {
                console.log(`Gatilho encontrado: ${response.trigger}`);
                responseFound = true;

                if (response.type === 'text') {
                    msg.reply(response.message);
                } else if (response.type === 'audio') {
                    const audioDir = path.join(__dirname, './audios');
                    const audioPath = path.join(audioDir, response.fileName);

                    if (!fs.existsSync(audioDir)) {
                        fs.mkdirSync(audioDir, { recursive: true });
                        console.log('Pasta "audios" criada com sucesso!');
                    }

                    if (fs.existsSync(audioPath)) {
                        const audio = MessageMedia.fromFilePath(audioPath);
                        client.sendMessage(msg.from, audio).then(() => {
                            console.log('Áudio enviado com sucesso!');
                        }).catch((err) => {
                            console.error('Erro ao enviar áudio:', err);
                        });
                    } else {
                        console.error(`Arquivo de áudio não encontrado: ${audioPath}`);
                        msg.reply('Desculpe, o arquivo de áudio não está disponível.');
                    }
                }
            }
        });

        // Se não encontrou nenhuma resposta configurada, chama a API do GPT-3
        if (!responseFound) {
            try {
                const aiResponse = await queryOpenAI(normalizedMessage);
                console.log("Resposta da IA:", aiResponse);

                // Se a IA retornar uma resposta válida
                if (aiResponse) {
                    msg.reply(aiResponse);
                } else {
                    // Caso a IA não retorne nada válido, envia uma mensagem padrão
                    msg.reply("Desculpe, não consegui entender sua solicitação. Você pode reformular?");
                }
            } catch (error) {
                console.error("Erro ao chamar a API do GPT-3:", error);
                // Caso de erro na requisição ao GPT-3
                msg.reply("Desculpe, não consegui processar sua solicitação. Tente novamente mais tarde.");
            }
        }
    });

    client.initialize();
};
