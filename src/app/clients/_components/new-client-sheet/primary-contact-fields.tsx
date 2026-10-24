import { Input } from "@/components/ui/input";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { ClientFormValues } from "../../_utils/client-form";
import { FormField } from "./form-field";

interface PrimaryContactFieldsProps {
  register: UseFormRegister<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
}

export function PrimaryContactFields({
  register,
  errors,
}: PrimaryContactFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Contact Name *" error={errors.contactName?.message}>
          <Input
            placeholder="e.g. Sarah Johnson"
            {...register("contactName")}
          />
        </FormField>
        <FormField
          label="Contact Position *"
          error={errors.contactPosition?.message}
        >
          <Input
            placeholder="e.g. HR Director"
            {...register("contactPosition")}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Contact Email *" error={errors.contactEmail?.message}>
          <Input
            type="email"
            placeholder="sarah@company.com"
            {...register("contactEmail")}
          />
        </FormField>
        <FormField label="Contact Phone *" error={errors.contactPhone?.message}>
          <Input
            placeholder="+1 (555) 000-0000"
            {...register("contactPhone")}
          />
        </FormField>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        This contact will be added as the primary contact. You can manage it
        later in the Contacts tab.
      </p>
    </>
  );
}
