import NotesModule, { NotesModuleProps } from "@/features/profiles/ui/modules/NotesModule";

type Props = Omit<NotesModuleProps, "title" | "placeholder" | "emptyText">;

export default function MedicalModule(props: Props) {
  return (
    <NotesModule
      title="Medical"
      placeholder="Add medical notes..."
      emptyText="No medical info added yet."
      {...props}
    />
  );
}
