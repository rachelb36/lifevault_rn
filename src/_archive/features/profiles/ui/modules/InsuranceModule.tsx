import NotesModule, { NotesModuleProps } from "@/features/profiles/ui/modules/NotesModule";

type Props = Omit<NotesModuleProps, "title" | "placeholder" | "emptyText">;

export default function InsuranceModule(props: Props) {
  return (
    <NotesModule
      title="Insurance"
      placeholder="Add insurance notes..."
      emptyText="No insurance info added yet."
      {...props}
    />
  );
}
