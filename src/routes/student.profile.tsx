import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, Avatar, Btn, Chip, TONE, EmptyState } from "@/components/rooster/student/ui";
import { LoadingCards } from "@/components/shared";
import { studentService, type StudentProfile } from "@/services/mock-api/student.service";
import { UserX, Lock, Pencil, Save, X, Mail, IdCard } from "lucide-react";

export const Route = createFileRoute("/student/profile")({ component: StudentProfilePage });

type Field = { key: string; label: string; value: string };

function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [personalEmail, setPersonalEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    studentService.getMe().then((p) => {
      if (!alive) return;
      setProfile(p ?? null);
      setPersonalEmail(p?.email ?? "");
    }).catch(() => { if (alive) setProfile(null); });
    return () => { alive = false; };
  }, []);

  if (profile === undefined) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student" title="Perfil acadêmico" description="Dados cadastrais e vínculo institucional." />
        <LoadingCards count={2} />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student" title="Perfil acadêmico" description="Dados cadastrais e vínculo institucional." />
        <EmptyState icon={UserX} title="Sem vínculo de aluno" description="O usuário autenticado não possui um registro de aluno associado no Rooster Academy." />
      </>
    );
  }

  const identification: Field[] = [
    { key: "name", label: "Nome completo", value: profile.name },
    { key: "email", label: "E-mail institucional", value: profile.email },
    { key: "ra", label: "Matrícula (RA)", value: profile.ra },
  ];

  const academic: Field[] = [
    { key: "course", label: "Curso", value: profile.courseName },
    { key: "courseCode", label: "Código do curso", value: profile.courseCode || "—" },
    { key: "degree", label: "Modalidade", value: profile.degree || "—" },
    { key: "semester", label: "Semestre atual", value: `${profile.semester}º semestre` },
    { key: "status", label: "Situação", value: profile.status },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student"
        title="Perfil acadêmico"
        description="Dados cadastrais e vínculo institucional. Mantidos pela secretaria — Rooster Hub / Academy."
        actions={
          editing ? (
            <div className="flex gap-2">
              <Btn onClick={() => setEditing(false)}><X className="h-4 w-4" /> Cancelar</Btn>
              <Btn variant="solid" onClick={() => { setEditing(false); setSaved(true); }}><Save className="h-4 w-4" /> Salvar</Btn>
            </div>
          ) : (
            <Btn variant="solid" onClick={() => { setEditing(true); setSaved(false); }}><Pencil className="h-4 w-4" /> Editar contato</Btn>
          )
        }
      />

      {saved && (
        <div className="mb-4 rounded-xl border p-3 text-sm" style={{ borderColor: `color-mix(in oklab, ${TONE.ok} 35%, transparent)`, background: `color-mix(in oklab, ${TONE.ok} 8%, transparent)` }}>
          Dados de contato atualizados localmente. Este portal ainda não expõe uma API de atualização de contato pessoal.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <SectionCard title="Identificação">
            <div className="flex flex-col items-center text-center">
              <Avatar initials={profile.initials} tone={profile.photoTone} size={96} />
              <p className="mt-3 text-base font-semibold">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.courseName}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                <Chip tone={TONE.ok}>{profile.status}</Chip>
                <Chip tone={TONE.info}>RA {profile.ra}</Chip>
                <Chip tone={TONE.cyan}>{profile.semester}º semestre</Chip>
              </div>
              <div className="mt-4 w-full space-y-2 text-left text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {profile.email}</p>
                <p className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5" /> {profile.courseCode || profile.courseName}</p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Contato" description="E-mail pessoal (armazenamento de contato ainda não integrado ao backend).">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-background/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">E-mail pessoal</p>
                  {!editing ? <Lock className="h-3 w-3 text-muted-foreground" /> : null}
                </div>
                {editing ? (
                  <input
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                ) : (
                  <p className="mt-1 text-sm">{personalEmail || "—"}</p>
                )}
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Vínculo acadêmico" description="Mantido pela secretaria — Rooster Hub / Academy.">
            <div className="grid gap-3 sm:grid-cols-2">
              {[...identification, ...academic].map((f) => (
                <div key={f.key} className="rounded-xl border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="mt-1 text-sm">{f.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
