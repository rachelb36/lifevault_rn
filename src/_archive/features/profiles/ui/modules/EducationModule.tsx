import NotesModule, { NotesModuleProps } from "@/features/profiles/ui/modules/NotesModule";

type Props = Omit<NotesModuleProps, "title">;

export default function EducationModule({ placeholder, emptyText, ...rest }: Props) {
  return (
    <NotesModule
      title="Education"
      placeholder={placeholder ?? "Add education notes..."}
      emptyText={emptyText ?? "No education info added yet."}
      {...rest}
    />
  );
}
