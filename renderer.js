// Recebe e exibe o QR Code
window.electron.receive('qr-code', (qr) => {
  try {
    // Verifica se o QR Code foi recebido corretamente
    if (!qr) {
      throw new Error('QR Code não recebido ou inválido');
    }

    const qrImage = document.createElement('img');
    qrImage.src = `data:image/png;base64,${qr}`;  // Aqui a imagem é gerada a partir do base64

    const qrCodeContainer = document.getElementById('qr-code');
    
    // Limpa o conteúdo anterior e insere a imagem do QR Code
    qrCodeContainer.innerHTML = '';
    qrCodeContainer.appendChild(qrImage);
  } catch (error) {
    console.error('Erro ao exibir QR Code:', error);
    const qrCodeContainer = document.getElementById('qr-code');
    qrCodeContainer.innerHTML = '<p>Erro ao carregar QR Code.</p>';  // Exibe uma mensagem de erro no caso de falha
  }
});

// Atualiza o status da conexão
window.electron.receive('status', (status) => {
  try {
    const statusElement = document.getElementById('connection-status');
    
    // Verifica se o status é válido
    if (status && typeof status === 'string') {
      statusElement.textContent = `Status: ${status}`;
    } else {
      throw new Error('Status inválido recebido');
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = 'Status: Erro ao carregar status';
  }
});
