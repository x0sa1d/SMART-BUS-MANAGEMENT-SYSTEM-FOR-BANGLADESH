import { getUsers } from "@/actions/user.actions";
import { searchActiveCompanies } from "@/actions/company.actions";
import { UsersContent } from "./users-content";

export async function UsersView() {
  const [users, companies] = await Promise.all([
    getUsers(),
    searchActiveCompanies(),
  ]);
  return (
    <UsersContent
      users={JSON.parse(JSON.stringify(users))}
      companies={companies}
    />
  );
}
