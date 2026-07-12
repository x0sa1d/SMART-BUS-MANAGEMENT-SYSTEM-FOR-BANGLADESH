import { getRolePolicies } from "@/actions/policy.actions";
import { PoliciesContent } from "./policies-content";

export async function PoliciesView() {
  const { permissions, matrix } = await getRolePolicies();
  return (
    <PoliciesContent
      permissions={JSON.parse(JSON.stringify(permissions))}
      matrix={JSON.parse(JSON.stringify(matrix))}
    />
  );
}
