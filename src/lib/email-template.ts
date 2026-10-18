
/** Substitute `{{var}}` placeholders in template strings with values. */
export function substituteTemplate(
  tpl: string,
  vars?: Record<string, string>
): string {
  if (!vars) return tpl;
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? vars[key] : `{{${key}}}`
  );
}

/** Default subject line when no email template is configured. */
export function defaultSubject(
  type: 'offer' | 'rejection' | 'general' | 'follow_up'
): string {
  switch (type) {
    case 'offer':
      return 'Offer from our team';
    case 'rejection':
      return 'Update on your application';
    case 'follow_up':
      return 'Following up on your application';
    default:
      return '';
  }
}
