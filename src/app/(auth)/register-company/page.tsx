import { getDivisions } from "@/actions/location.actions";
import { CompanyRegisterForm } from "@/features/company/company-register-form";
import { serializeForClient } from "@/lib/serialize";
import Link from "next/link";
import { APP_NAME } from "@/constants";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RegisterCompanyPage() {
  const divisions = await getDivisions();

  return (
    <div className="min-h-screen auth-shell flex flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            {APP_NAME}
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-10 page-enter">
        <CompanyRegisterForm divisions={serializeForClient(divisions)} />
      </main>
    </div>
  );
}
