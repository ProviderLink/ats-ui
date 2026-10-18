const RESOURCE_LABEL: Record<string, string> = {
  candidate: 'the candidate',
  job: 'the job',
  client: 'the client',
  application: 'the application',
  interview: 'the interview',
  user: 'the user',
  assignment: 'the assignment',
  tag: 'the tag',
  work_entry: 'the work entry',
  eod: 'the EOD report',
  performance_review: 'the performance review',
  settings: 'the workspace settings',
  pipeline_template: 'the pipeline template',
  email_template: 'the email template',
  report: 'a report',
};

export function resourceLabel(resourceType: string): string {
  if (!resourceType) return 'this record';
  return (
    RESOURCE_LABEL[resourceType] ?? `the ${resourceType.replace(/_/g, ' ')}`
  );
}
