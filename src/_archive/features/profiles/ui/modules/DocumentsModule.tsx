import NotesModule, { NotesModuleProps } from "@/features/profiles/ui/modules/NotesModule";

type Props = Omit<NotesModuleProps, "title" | "placeholder" | "emptyText">;

export default function DocumentsModule(props: Props) {
  return (
    <NotesModule
      title="Documents"
      placeholder="Add document notes..."
      emptyText="No documents added yet."
      {...props}
    />
  );
}
