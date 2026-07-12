import { db } from "@/lib/db";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run promote-admin -- email@example.com");
    process.exit(1);
  }
  const user = await db.user.update({
    where: { email },
    data: { role: "SUPER_ADMIN" },
  });
  console.log(`Promoted ${user.email} to SUPER_ADMIN`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
