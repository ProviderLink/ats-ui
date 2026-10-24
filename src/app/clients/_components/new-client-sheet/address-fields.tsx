import { Input } from "@/components/ui/input";
import type { ClientFormValues } from "../../_utils/client-form";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormField } from "./form-field";

interface AddressFieldsProps {
  register: UseFormRegister<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
}

export function AddressFields({ register, errors }: AddressFieldsProps) {
  return (
    <>
      <FormField label="Street">
        <Input placeholder="123 Main St" {...register("address.street")} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="City *" error={errors.address?.city?.message}>
          <Input placeholder="e.g. New York" {...register("address.city")} />
        </FormField>
        <FormField label="State *" error={errors.address?.state?.message}>
          <Input placeholder="e.g. NY" {...register("address.state")} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Country *" error={errors.address?.country?.message}>
          <Input placeholder="e.g. USA" {...register("address.country")} />
        </FormField>
        <FormField label="Postal Code">
          <Input placeholder="e.g. 10001" {...register("address.postalCode")} />
        </FormField>
      </div>
    </>
  );
}
