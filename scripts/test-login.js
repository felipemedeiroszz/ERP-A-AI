const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🔍 Testando login dos usuários...');
  
  const users = [
    { email: 'admin@acai.com', password: 'admin123' },
    { email: 'atendente@acai.com', password: 'atend123' },
    { email: 'cozinha@acai.com', password: 'cozinha123' },
    { email: 'entregador@acai.com', password: 'entregador123' },
  ];

  for (const userData of users) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!user) {
        console.log(`❌ Usuário não encontrado: ${userData.email}`);
        continue;
      }

      const isValid = await bcrypt.compare(userData.password, user.password);
      
      if (isValid) {
        console.log(`✅ Login OK: ${userData.email} (${user.role})`);
      } else {
        console.log(`❌ Senha inválida: ${userData.email}`);
        console.log(`   Senha no banco: ${user.password.substring(0, 20)}...`);
      }
    } catch (error) {
      console.error(`❌ Erro ao testar ${userData.email}:`, error.message);
    }
  }

  await prisma.$disconnect();
}

testLogin();
