import { requireAuth } from "@/lib/auth-server";
import { getAccessContext } from "@/lib/permissions";
import { ProfileForm } from "@/features/profile/profile-form";

export default async function PassengerProfilePage() {
  const session = await requireAuth();
  const access = getAccessContext({ role: (session.user as { role?: string }).role as "PASSENGER" });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Profile</h1></div>
      <ProfileForm
        name={session.user.name}
        email={session.user.email}
        roleLabel={access.roleLabel}
      />
    </div>
  );
}
