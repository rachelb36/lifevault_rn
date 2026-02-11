import NotesModule, { NotesModuleProps } from "@/components/modules/NotesModule";

type Props = Omit<NotesModuleProps, "title" | "placeholder" | "emptyText">;

export default function EmergencyContactsModule(props: Props) {
  return (
    <NotesModule
      title="Emergency Contacts"
      placeholder="Add emergency contact notes..."
      emptyText="No emergency contacts added yet."
      {...props}
    />
  );
}
