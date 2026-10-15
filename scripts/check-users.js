const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Verificando usuários no banco de dados...');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  console.log(`\n📊 Total de usuários: ${users.length}\n`);

  for (const user of users) {
    console.log(`👤 ${user.name} (${user.role})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Ativo: ${user.active ? '✅' : '❌'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Criado em: ${user.createdAt}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkUsers();
