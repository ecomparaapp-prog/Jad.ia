import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import { logger } from "./logger";

export async function seedAdminUser(): Promise<void> {
  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "admin@jadi.ia"));

    if (existing) {
      logger.info("Usuário admin já existe — seed ignorado");
      return;
    }

    const passwordHash = await hashPassword("admin123");
    await db.insert(usersTable).values({
      name: "Admin",
      email: "admin@jadi.ia",
      passwordHash,
    });

    logger.info("Usuário de teste criado: admin@jadi.ia / admin123");
  } catch (err) {
    logger.error({ err }, "Erro ao criar usuário de teste");
  }
}
