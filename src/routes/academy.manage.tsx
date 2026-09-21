import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar } from "@/components/shared";
import { DisciplinesTab } from "@/components/rooster/academy/manage/disciplines-tab";
import { ClassesTab } from "@/components/rooster/academy/manage/classes-tab";
import { TeachersTab } from "@/components/rooster/academy/manage/teachers-tab";
import { StudentsTab } from "@/components/rooster/academy/manage/students-tab";
import { CalendarTab } from "@/components/rooster/academy/manage/calendar-tab";

export const Route = createFileRoute("/academy/manage")({
  head: () => ({
    meta: [
      { title: "Gestão acadêmica — Rooster Academy" },
      { name: "description", content: "Disciplinas, turmas, professores e calendário acadêmico." },
    ],
  }),
  component: AcademyManage,
});

const TABS = [
  { value: "disciplinas", label: "Disciplinas" },
  { value: "turmas", label: "Turmas" },
  { value: "professores", label: "Professores" },
  { value: "alunos", label: "Alunos" },
  { value: "calendario", label: "Calendário" },
];

function AcademyManage() {
  const [tab, setTab] = useState("disciplinas");
  return (
    <>
      <PageHeader eyebrow="Rooster Academy" title="Gestão acadêmica" description="Disciplinas, turmas, corpo docente e calendário letivo em um só lugar." />
      <TabBar tabs={TABS} value={tab} onChange={setTab} className="mb-4" />
      {tab === "disciplinas" && <DisciplinesTab />}
      {tab === "turmas" && <ClassesTab />}
      {tab === "professores" && <TeachersTab />}
      {tab === "alunos" && <StudentsTab />}
      {tab === "calendario" && <CalendarTab />}
    </>
  );
}
