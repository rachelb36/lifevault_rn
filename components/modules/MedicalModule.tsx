import NotesModule, { NotesModuleProps } from "@/components/modules/NotesModule";

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
