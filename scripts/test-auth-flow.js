const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuthFlow() {
  console.log('🔍 Testando fluxo completo de autenticação...\n');

  // 1. Verificar conexão com banco
  try {
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    return;
  }

  // 2. Verificar usuários
  const users = await prisma.user.findMany();
  console.log(`✅ Total de usuários: ${users.length}`);

  // 3. Testar login de cada usuário
  const testCredentials = [
    { email: 'admin@acai.com', password: 'admin123', role: 'ADMIN' },
    { email: 'atendente@acai.com', password: 'atend123', role: 'ATTENDANT' },
    { email: 'cozinha@acai.com', password: 'cozinha123', role: 'KITCHEN' },
    { email: 'entregador@acai.com', password: 'entregador123', role: 'DELIVERY_DRIVER' },
  ];

  console.log('\n🔐 Testando credenciais:');
  for (const cred of testCredentials) {
    const user = await prisma.user.findUnique({
      where: { email: cred.email },
    });

    if (!user) {
      console.log(`❌ Usuário não encontrado: ${cred.email}`);
      continue;
    }

    const isValid = await bcrypt.compare(cred.password, user.password);
    
    if (isValid && user.active) {
      console.log(`✅ ${cred.role}: ${cred.email} - SENHA CORRETA`);
    } else if (!user.active) {
      console.log(`❌ ${cred.role}: ${cred.email} - USUÁRIO INATIVO`);
    } else {
      console.log(`❌ ${cred.role}: ${cred.email} - SENHA INCORRETA`);
    }
  }

  // 4. Verificar configurações essenciais
  console.log('\n⚙️  Verificando configurações:');
  
  const companySettings = await prisma.companySettings.count();
  console.log(`✅ Configurações da empresa: ${companySettings}`);

  const storeSettings = await prisma.storeSettings.count();
  console.log(`✅ Configurações da loja: ${storeSettings}`);

  const categories = await prisma.category.count();
  console.log(`✅ Categorias: ${categories}`);

  const products = await prisma.product.count();
  console.log(`✅ Produtos: ${products}`);

  console.log('\n🎉 Teste de autenticação concluído!');
  console.log('📋 Acesse http://localhost:3000/login para entrar no sistema');

  await prisma.$disconnect();
}

testAuthFlow();
