const path = require('path');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const prisma = new PrismaClient();

async function main() {
  const [, , userId, newPassword] = process.argv;

  if (!userId || !newPassword) {
    console.error('Usage: npm run user:password -- <userId> <newPassword>');
    process.exitCode = 1;
    return;
  }

  if (newPassword.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exitCode = 1;
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!existingUser) {
    console.error(`User not found: ${userId}`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true, email: true, name: true, role: true, updatedAt: true },
  });

  console.log('Password updated successfully.');
  console.log(JSON.stringify(updatedUser, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
