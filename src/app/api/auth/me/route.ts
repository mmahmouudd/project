import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return Response.json({ error: "No active session." }, { status: 401 });
  }
  return Response.json({
    user: { id: user.id, name: user.name, email: user.email, className: user.className },
  });
}
