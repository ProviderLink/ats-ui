import { ApplicantDetailsFields } from '@/components/candidate-form/applicant-details-fields';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ApplyDetailsCard() {
  return (
    <Card className="careers-card rounded-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-lg">
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ApplicantDetailsFields />
      </CardContent>
    </Card>
  );
}
