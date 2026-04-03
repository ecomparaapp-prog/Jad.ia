import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import { logger } from "./logger";

const ADMIN_EMAIL = "admin@jadi.ia";
const ADMIN_PASSWORD = "admin123";
const WRONG_EMAIL = "admin@jad.ia";

export async function seedAdminUser(): Promise<void> {
  try {
    const [wrongUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, WRONG_EMAIL));

    if (wrongUser) {
      await db.delete(usersTable).where(eq(usersTable.email, WRONG_EMAIL));
      logger.info("Usuário com email incorreto removido: admin@jad.ia");
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL));

    if (existing) {
      logger.info("Usuário admin já existe — seed ignorado");
      return;
    }

    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    await db.insert(usersTable).values({
      name: "Admin",
      email: ADMIN_EMAIL,
      passwordHash,
    });

    logger.info(`Usuário de teste criado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } catch (err) {
    logger.error({ err }, "Erro ao criar usuário de teste");
  }
}
