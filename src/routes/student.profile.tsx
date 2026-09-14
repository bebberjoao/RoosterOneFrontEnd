import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, Avatar, Btn, Chip, TONE } from "@/components/rooster/student/ui";
import { PROFILE } from "@/components/rooster/student/mock-data";
import { Lock, Pencil, Save, X, Mail, Phone, MapPin, IdCard, Camera } from "lucide-react";

export const Route = createFileRoute("/student/profile")({ component: StudentProfile });

type Field = { key: string; label: string; value: string; editable?: boolean };

function StudentProfile() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    personalEmail: PROFILE.personalEmail,
    phone: PROFILE.phone,
    address: PROFILE.address,
    district: PROFILE.district,
    city: PROFILE.city,
    zip: PROFILE.zip,
    emergency: PROFILE.emergency,
  });
  const [saved, setSaved] = useState(false);

  const personal: Field[] = [
    { key: "name", label: "Nome completo", value: PROFILE.name },
    { key: "birth", label: "Data de nascimento", value: PROFILE.birth },
    { key: "cpf", label: "CPF", value: PROFILE.cpf },
    { key: "rg", label: "RG", value: PROFILE.rg },
    { key: "email", label: "E-mail institucional", value: PROFILE.email },
    { key: "personalEmail", label: "E-mail pessoal", value: form.personalEmail, editable: true },
    { key: "phone", label: "Telefone", value: form.phone, editable: true },
    { key: "emergency", label: "Contato de emergência", value: form.emergency, editable: true },
  ];

  const academic: Field[] = [
    { key: "ra", label: "Matrícula (RA)", value: PROFILE.ra },
    { key: "course", label: "Curso", value: PROFILE.course },
    { key: "degree", label: "Modalidade", value: PROFILE.degree },
    { key: "semester", label: "Período atual", value: PROFILE.semester },
    { key: "term", label: "Semestre letivo", value: PROFILE.term },
    { key: "klass", label: "Turma", value: PROFILE.klass },
    { key: "shift", label: "Turno", value: PROFILE.shift },
    { key: "campus", label: "Campus", value: PROFILE.campus },
    { key: "coordinator", label: "Coordenador responsável", value: `${PROFILE.coordinator} · ${PROFILE.coordinatorEmail}` },
    { key: "enrolledAt", label: "Ingresso", value: PROFILE.enrolledAt },
  ];

  const address: Field[] = [
    { key: "address", label: "Endereço", value: form.address, editable: true },
    { key: "district", label: "Bairro", value: form.district, editable: true },
    { key: "city", label: "Cidade / UF", value: form.city, editable: true },
    { key: "zip", label: "CEP", value: form.zip, editable: true },
  ];

  const renderField = (f: Field) => (
    <div key={f.key} className="rounded-xl border bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
        {!f.editable ? <Lock className="h-3 w-3 text-muted-foreground" /> : null}
      </div>
      {editing && f.editable ? (
        <input
          value={(form as Record<string, string>)[f.key]}
          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
          className="mt-1.5 w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      ) : (
        <p className="mt-1 text-sm">{f.value}</p>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student"
        title="Perfil acadêmico"
        description="Dados cadastrais, vínculo institucional e informações de contato. Campos bloqueados são mantidos pela secretaria."
        actions={
          editing ? (
            <div className="flex gap-2">
              <Btn onClick={() => setEditing(false)}><X className="h-4 w-4" /> Cancelar</Btn>
              <Btn variant="solid" onClick={() => { setEditing(false); setSaved(true); }}><Save className="h-4 w-4" /> Salvar</Btn>
            </div>
          ) : (
            <Btn variant="solid" onClick={() => { setEditing(true); setSaved(false); }}><Pencil className="h-4 w-4" /> Editar dados permitidos</Btn>
          )
        }
      />

      {saved && (
        <div className="mb-4 rounded-xl border p-3 text-sm" style={{ borderColor: `color-mix(in oklab, ${TONE.ok} 35%, transparent)`, background: `color-mix(in oklab, ${TONE.ok} 8%, transparent)` }}>
          Dados atualizados com sucesso. Alterações de contato ficam disponíveis imediatamente para a instituição.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <SectionCard title="Identificação">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar initials={PROFILE.initials} tone={PROFILE.photoTone} size={96} />
                <button className="absolute -bottom-1 -right-1 rounded-full border bg-card p-1.5 hover:bg-accent" title="Alterar foto">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-3 text-base font-semibold">{PROFILE.name}</p>
              <p className="text-xs text-muted-foreground">{PROFILE.course}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                <Chip tone={TONE.ok}>{PROFILE.status}</Chip>
                <Chip tone={TONE.info}>RA {PROFILE.ra}</Chip>
                <Chip tone={TONE.cyan}>{PROFILE.semester}</Chip>
              </div>
              <div className="mt-4 w-full space-y-2 text-left text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {PROFILE.email}</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {form.phone}</p>
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {form.city}</p>
                <p className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5" /> {PROFILE.klass}</p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Dados pessoais" description="Somente contatos podem ser editados pelo aluno.">
            <div className="grid gap-3 sm:grid-cols-2">{personal.map(renderField)}</div>
          </SectionCard>
          <SectionCard title="Vínculo acadêmico" description="Mantido pela secretaria — Rooster Hub / Academy.">
            <div className="grid gap-3 sm:grid-cols-2">{academic.map(renderField)}</div>
          </SectionCard>
          <SectionCard title="Endereço" description="Atualize sempre que houver mudança.">
            <div className="grid gap-3 sm:grid-cols-2">{address.map(renderField)}</div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
