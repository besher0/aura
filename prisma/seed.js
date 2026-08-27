const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const image = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80';

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || (process.env.NODE_ENV === 'development' ? 'Admin123!' : '');
  const userPassword = process.env.SEED_USER_PASSWORD || (process.env.NODE_ENV === 'development' ? 'User123!' : '');
  if (!adminPassword || !userPassword) throw new Error('SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD are required outside development');
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({ where: { email: 'admin@aura.local' }, update: {}, create: { name: 'Aura Admin', email: 'admin@aura.local', passwordHash, role: 'ADMIN' } });
  const userHash = await bcrypt.hash(userPassword, 12);
  await prisma.user.upsert({ where: { email: 'sara.ahmed@example.com' }, update: {}, create: { name: 'سارة أحمد', email: 'sara.ahmed@example.com', passwordHash: userHash } });
  const store = await prisma.store.upsert({ where: { id: 'store-aura' }, update: {}, create: { id: 'store-aura', name: 'متجر Aura', type: 'عطور وتجميل', imageUrl: image } });
  const category = await prisma.category.upsert({ where: { name: 'عطور' }, update: {}, create: { name: 'عطور', description: 'تشكيلة فاخرة من العطور' } });
  for (const item of [
    ['عطر مسك الورد', '250.00', 25], ['عطر روز إلكسير', '350.00', 18], ['عطر Aura Signature', '520.00', 0],
    ['كريم الترطيب العميق', '450.00', 42], ['أحمر شفاه كلاسيك', '120.00', 31]
  ]) await prisma.product.upsert({ where: { id: `product-${item[0]}` }, update: {}, create: { id: `product-${item[0]}`, name: item[0], price: item[1], stock: item[2], imageUrl: image, storeId: store.id, categoryId: category.id } });
  console.log(`Seeded Aura data for ${admin.email}`);
}
main().finally(() => prisma.$disconnect());
