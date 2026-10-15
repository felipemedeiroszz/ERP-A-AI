const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuários padrão
  const users = [
    {
      email: 'admin@acai.com',
      name: 'Administrador',
      password: 'admin123',
      role: 'ADMIN',
    },
    {
      email: 'atendente@acai.com',
      name: 'Atendente',
      password: 'atend123',
      role: 'ATTENDANT',
    },
    {
      email: 'cozinha@acai.com',
      name: 'Cozinha',
      password: 'cozinha123',
      role: 'KITCHEN',
    },
    {
      email: 'entregador@acai.com',
      name: 'Entregador',
      password: 'entregador123',
      role: 'DELIVERY_DRIVER',
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        password: hashedPassword,
        role: user.role,
        active: true,
      },
    });
    console.log(`✅ Usuário ${user.role} criado:`, user.email);
  }

  // Criar configurações da empresa
  const companySettings = await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Açaiteria Exemplo',
      fantasyName: 'Açai Delícia',
      phone: '(11) 99999-9999',
      whatsapp: '(11) 99999-9999',
      email: 'contato@acai.com',
      street: 'Rua Exemplo',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000',
      document: '00.000.000/0001-00',
    },
  });
  console.log('✅ Configurações da empresa criadas');

  // Criar configurações da loja
  const storeSettings = await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      isOpen: true,
      openTime: '10:00',
      closeTime: '22:00',
      averagePreparationTime: 20,
      deliveryEnabled: true,
      pickupEnabled: true,
      deliveryFee: 5.00,
      minDeliveryValue: 20.00,
      deliveryRadiusKm: 5.0,
      weightPricePerKg: 59.90,
    },
  });
  console.log('✅ Configurações da loja criadas');

  // Criar configurações de aparência
  const appearanceSettings = await prisma.appearanceSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      primaryColor: '#6B21A8',
      secondaryColor: '#8B5CF6',
      accentColor: '#A855F7',
      buttonColor: '#6B21A8',
    },
  });
  console.log('✅ Configurações de aparência criadas');

  // Criar categoria exemplo
  const category = await prisma.category.upsert({
    where: { slug: 'acais' },
    update: {},
    create: {
      name: 'Açaís',
      slug: 'acais',
      order: 1,
      active: true,
    },
  });
  console.log('✅ Categoria criada:', category.name);

  // Criar produto exemplo
  const product = await prisma.product.upsert({
    where: { id: 'produto-exemplo' },
    update: {},
    create: {
      id: 'produto-exemplo',
      name: 'Açaí Tradicional',
      description: 'Açaí tradicional com granola e banana',
      price: 25.00,
      categoryId: category.id,
      isWeightBased: true,
      active: true,
    },
  });
  console.log('✅ Produto criado:', product.name);

  // Criar adicional exemplo
  const addon = await prisma.addon.upsert({
    where: { id: 'adicional-exemplo' },
    update: {},
    create: {
      id: 'adicional-exemplo',
      name: 'Nutella',
      price: 5.00,
      active: true,
    },
  });
  console.log('✅ Adicional criado:', addon.name);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📋 Credenciais de acesso:');
  console.log('   Admin: admin@acai.com / admin123');
  console.log('   Atendente: atendente@acai.com / atend123');
  console.log('   Cozinha: cozinha@acai.com / cozinha123');
  console.log('   Entregador: entregador@acai.com / entregador123');
  console.log('');
  console.log('⚠️  Altere as senhas após o primeiro login!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
