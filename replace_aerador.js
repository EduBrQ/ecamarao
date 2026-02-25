const fs = require('fs');

const source = 'c:\\Users\\Eduardo\\Documents\\PROJETOS\\ecamarao\\frontend\\src\\pages\\Aeradores_new.tsx';
const target = 'c:\\Users\\Eduardo\\Documents\\PROJETOS\\ecamarao\\frontend\\src\\pages\\Aeradores.tsx';

try {
  // Ler o arquivo novo
  const content = fs.readFileSync(source, 'utf8');
  
  // Escrever no arquivo antigo
  fs.writeFileSync(target, content);
  
  console.log('Arquivo Aeradores.tsx atualizado com sucesso!');
} catch (error) {
  console.error('Erro ao substituir arquivo:', error);
}
