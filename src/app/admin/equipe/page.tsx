import { changeMemberRole, removeMember } from "@/app/actions/admin";
import { AutoSubmitSelect, ConfirmButton, InviteMemberForm } from "@/components/admin/forms";
import { Card, Icon, PageHeader } from "@/components/dashboard/ui";
import { listTeam } from "@/lib/admin/data";
import { formatDate, isStaffRole, ROLE_LABEL, ROLES } from "@/lib/workflow";

export default async function TeamPage() {
  const { user, members } = await listTeam();
  const staff = members.filter((m) => isStaffRole(m.role));
  const mosques = members.filter((m) => m.role === "mosquee");

  return (
    <>
      <PageHeader
        eyebrow="ESPACE ADMIN"
        title="Équipe et accès"
        description="Invitez le personnel Masjid Energie et l’équipe technique, et gérez les rôles. Seuls les administrateurs voient cette page."
      />

      <div className="grid gap-6">
        <Card title="Inviter une personne" icon="userPlus">
          <InviteMemberForm />
          <ul className="mt-4 grid gap-1 text-[13px] text-muted sm:grid-cols-3">
            <li>
              <strong className="text-fg">Administrateur</strong> : tout, y compris l’équipe.
            </li>
            <li>
              <strong className="text-fg">Équipe Masjid Energie</strong> : demandes, comptes mosquées, commentaires.
            </li>
            <li>
              <strong className="text-fg">Équipe technique</strong> : mêmes accès, pour les études et installations.
            </li>
          </ul>
        </Card>

        {[
          { title: `Équipe (${staff.length})`, icon: "users" as const, list: staff },
          { title: `Comptes mosquées (${mosques.length})`, icon: "pin" as const, list: mosques },
        ].map(({ title, icon, list }) => (
          <Card key={title} title={title} icon={icon} className="[&>div]:p-0">
            {list.length === 0 ? (
              <p className="px-5 py-4 text-[14px] text-muted">Aucun compte pour l’instant.</p>
            ) : (
              <ul className="divide-y divide-line">
                {list.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                    <span className="flex size-9 flex-none items-center justify-center rounded-full bg-brand/10 text-[12.5px] font-bold text-brand-text">
                      {(m.full_name || m.email).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="grid min-w-[200px] flex-1 leading-tight">
                      <span className="text-[14.5px] font-semibold text-heading">
                        {m.full_name || m.email}
                        {m.id === user.id && <span className="ml-2 text-[12px] font-medium text-muted">(vous)</span>}
                      </span>
                      <span className="text-[13px] text-muted">
                        {m.email}
                        {m.mosque && ` · ${m.mosque.name}`} · depuis le {formatDate(m.created_at)}
                      </span>
                    </span>
                    {m.id === user.id ? (
                      <span className="text-[13.5px] font-medium text-fg">{ROLE_LABEL[m.role]}</span>
                    ) : (
                      <>
                        <form action={changeMemberRole} className="w-[220px]">
                          <input type="hidden" name="id" value={m.id} />
                          <AutoSubmitSelect name="role" defaultValue={m.role} label={`Rôle de ${m.full_name || m.email}`}>
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABEL[r]}
                              </option>
                            ))}
                          </AutoSubmitSelect>
                        </form>
                        <form action={removeMember}>
                          <input type="hidden" name="id" value={m.id} />
                          <ConfirmButton
                            message={`Supprimer définitivement le compte de ${m.full_name || m.email} ?`}
                            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10"
                          >
                            <Icon name="trash" className="size-4" />
                            <span className="sr-only">Supprimer le compte</span>
                          </ConfirmButton>
                        </form>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
