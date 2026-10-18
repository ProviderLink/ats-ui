import { ApplicantDetailsFields } from '@/components/candidate-form/applicant-details-fields';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ImportDetailsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ApplicantDetailsFields />
      </CardContent>
    </Card>
  );
}
