import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Controller, useFormContext } from 'react-hook-form';
import type { ApplicantFieldsValues } from './applicant-schema';
import { EnglishProficiencySelect } from './english-proficiency-select';
import { Field } from './field';

const optionalNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : Number(v);

/** Must render inside a react-hook-form `FormProvider`. */
export function ApplicantDetailsFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ApplicantFieldsValues>();

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="First Name" required error={errors.firstName?.message}>
          <Input placeholder="e.g. Sarah" {...register('firstName')} />
        </Field>
        <Field label="Last Name" required error={errors.lastName?.message}>
          <Input placeholder="e.g. Williams" {...register('lastName')} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            placeholder="candidate@email.com"
            {...register('email')}
          />
        </Field>
        <Field label="Phone" required error={errors.phone?.message}>
          <Input placeholder="+1 (555) 000-0000" {...register('phone')} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Years of Experience"
          required
          error={errors.yearsOfExperience?.message}
        >
          <Input
            type="number"
            placeholder="0"
            min={0}
            className="w-full"
            {...register('yearsOfExperience', { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="English Proficiency"
          required
          error={errors.englishProficiency?.message}
        >
          <Controller
            control={control}
            name="englishProficiency"
            render={({ field }) => (
              <EnglishProficiencySelect
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>
      </div>
      <Field
        label="City of Residence"
        required
        error={errors.cityOfResidence?.message}
      >
        <Input
          placeholder="e.g. Manila"
          maxLength={100}
          {...register('cityOfResidence')}
        />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Current Salary (PHP)"
          error={errors.currentSalaryPHP?.message}
        >
          <Input
            type="number"
            placeholder="0"
            min={0}
            {...register('currentSalaryPHP', { setValueAs: optionalNumber })}
          />
        </Field>
        <Field
          label="Current Salary (USD)"
          error={errors.currentSalaryUSD?.message}
        >
          <Input
            type="number"
            placeholder="0"
            min={0}
            {...register('currentSalaryUSD', { setValueAs: optionalNumber })}
          />
        </Field>
      </div>
      <Field
        label="Reason for Leaving Last Position"
        error={errors.reasonForLeaving?.message}
      >
        <Textarea
          rows={3}
          placeholder="Optional..."
          maxLength={500}
          {...register('reasonForLeaving')}
        />
      </Field>
    </>
  );
}
