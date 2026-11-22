import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { TabBar } from "@/components/shared";
import { CoursesTab } from "@/components/rooster/academy/manage/courses-tab";
import { DisciplinesTab } from "@/components/rooster/academy/manage/disciplines-tab";
import { ClassesTab } from "@/components/rooster/academy/manage/classes-tab";
import { TeachersTab } from "@/components/rooster/academy/manage/teachers-tab";
import { StudentsTab } from "@/components/rooster/academy/manage/students-tab";
import { CalendarTab } from "@/components/rooster/academy/manage/calendar-tab";

export const Route = createFileRoute("/academy/manage")({
  head: () => ({
    meta: [
      { title: "Gestão acadêmica — Rooster Academy" },
      { name: "description", content: "Cursos, disciplinas, turmas, professores, alunos e calendário acadêmico." },
    ],
  }),
  component: AcademyManage,
});

// A ordem das abas acompanha o ciclo de cadastro: curso e disciplina, pessoas (professor e aluno), período letivo
// (em Calendário) e, por fim, a turma, que reúne disciplina, período, professor e matrículas.
const TABS = [
  { value: "cursos", label: "Cursos" },
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
      <PageHeader eyebrow="Rooster Academy" title="Gestão acadêmica" description="Cursos, disciplinas, turmas, corpo docente, alunos e calendário letivo em um só lugar." />
      <TabBar tabs={TABS} value={tab} onChange={setTab} className="mb-4" />
      {tab === "cursos" && <CoursesTab />}
      {tab === "disciplinas" && <DisciplinesTab />}
      {tab === "turmas" && <ClassesTab />}
      {tab === "professores" && <TeachersTab />}
      {tab === "alunos" && <StudentsTab />}
      {tab === "calendario" && <CalendarTab />}
    </>
  );
}
