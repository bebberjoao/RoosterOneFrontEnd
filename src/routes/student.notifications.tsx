import { createFileRoute } from "@tanstack/react-router";
import { NotificationsList } from "@/components/rooster/notifications/notifications-list";

export const Route = createFileRoute("/student/notifications")({
  component: () => <NotificationsList eyebrow="Rooster Student" />,
});
