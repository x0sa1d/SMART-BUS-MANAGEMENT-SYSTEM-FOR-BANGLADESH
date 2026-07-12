import { getAdmins } from "@/actions/user.actions";
import { AdminsContent } from "./admins-content";

export async function AdminsView() {
  const admins = await getAdmins();
  return <AdminsContent admins={JSON.parse(JSON.stringify(admins))} />;
}
