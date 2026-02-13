import NotesModule, { NotesModuleProps } from "@/features/profiles/ui/modules/NotesModule";

type Props = Omit<NotesModuleProps, "title" | "placeholder" | "emptyText">;

export default function AcademicModule(props: Props) {
  return (
    <NotesModule
      title="Academic"
      placeholder="Add school notes..."
      emptyText="Include school info and authorized pickup details."
      {...props}
    />
  );
}
