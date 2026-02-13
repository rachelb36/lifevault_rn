import NotesModule, { NotesModuleProps } from "@/features/profiles/ui/modules/NotesModule";

type Props = Omit<NotesModuleProps, "title" | "placeholder" | "emptyText">;

export default function ActivitiesModule(props: Props) {
  return (
    <NotesModule
      title="Activities & Interests"
      placeholder="Add activities and interests..."
      emptyText="No activities or interests added yet."
      {...props}
    />
  );
}
