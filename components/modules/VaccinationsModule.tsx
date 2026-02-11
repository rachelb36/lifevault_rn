import NotesModule, { NotesModuleProps } from "@/components/modules/NotesModule";

type Props = Omit<NotesModuleProps, "title" | "placeholder" | "emptyText">;

export default function VaccinationsModule(props: Props) {
  return (
    <NotesModule
      title="Vaccinations"
      placeholder="Add vaccination notes..."
      emptyText="No vaccination info added yet."
      {...props}
    />
  );
}
