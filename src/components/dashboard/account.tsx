import { signOut } from "@/app/actions/auth";
import { Icon } from "@/components/dashboard/ui";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { ROLE_LABEL } from "@/lib/workflow";

const initials = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/** Encart « utilisateur connecté + déconnexion » en bas du menu. */
export async function AccountBox() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 flex-none items-center justify-center rounded-full bg-gold text-[13px] font-bold text-brand-deep">
        {initials(user.fullName)}
      </span>
      <span className="grid min-w-0 flex-1 leading-tight">
        <span className="truncate text-[13.5px] font-semibold text-white">{user.fullName}</span>
        <span className="truncate text-[12px] text-on-brand/70">
          {isSupabaseConfigured ? ROLE_LABEL[user.role] : "Mode démo"}
        </span>
      </span>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-on-brand/70 hover:bg-white/10 hover:text-white"
        >
          <Icon name="logout" />
        </button>
      </form>
    </div>
  );
}
