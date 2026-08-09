import { requireAuth } from "@/lib/auth-server";
import { getAccessContext } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ProfileForm } from "@/features/profile/profile-form";

export default async function PassengerProfilePage() {
  const session = await requireAuth();
  const access = getAccessContext({ role: (session.user as { role?: string }).role as "PASSENGER" });
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      email: true,
      phone: true,
      image: true,
      passenger: { select: { phone: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>
      <ProfileForm
        name={user?.name || session.user.name}
        username={user?.username}
        email={user?.email || session.user.email}
        phone={user?.phone || user?.passenger?.phone}
        image={user?.image || session.user.image}
        roleLabel={access.roleLabel}
      />
    </div>
  );
}
