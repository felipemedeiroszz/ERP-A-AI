const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados...');
  
  try {
    // Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');

    // Verificar se o banco de dados existe
    const result = await prisma.$queryRaw`SELECT current_database()`;
    console.log('✅ Banco de dados ativo:', result[0].current_database);

    // Contar tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('✅ Tabelas criadas:', tables.length);

    // Verificar dados essenciais
    const userCount = await prisma.user.count();
    console.log('✅ Usuários no banco:', userCount);

    const categoryCount = await prisma.category.count();
    console.log('✅ Categorias no banco:', categoryCount);

    const productCount = await prisma.product.count();
    console.log('✅ Produtos no banco:', productCount);

    const settingsCount = await prisma.companySettings.count();
    console.log('✅ Configurações da empresa:', settingsCount);

    const storeSettingsCount = await prisma.storeSettings.count();
    console.log('✅ Configurações da loja:', storeSettingsCount);

    console.log('\n🎉 Todos os testes passaram! O banco de dados está funcionando perfeitamente.\n');
    
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
