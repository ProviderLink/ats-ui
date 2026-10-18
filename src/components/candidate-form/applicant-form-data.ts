import type { ApplicantFieldsValues } from './applicant-schema';

type ApplicantFormValues = ApplicantFieldsValues & {
  videoIntroUrl?: string;
  portfolioUrl?: string;
};

export function applicantFormData(values: ApplicantFormValues): FormData {
  const fd = new FormData();
  fd.append('firstName', values.firstName);
  fd.append('lastName', values.lastName);
  fd.append('email', values.email);
  fd.append('phone', values.phone);
  fd.append('yearsOfExperience', String(values.yearsOfExperience));
  if (values.englishProficiency)
    fd.append('englishProficiency', values.englishProficiency);
  if (values.currentSalaryPHP !== undefined)
    fd.append('currentSalaryPHP', String(values.currentSalaryPHP));
  if (values.currentSalaryUSD !== undefined)
    fd.append('currentSalaryUSD', String(values.currentSalaryUSD));
  if (values.reasonForLeaving)
    fd.append('reasonForLeaving', values.reasonForLeaving);
  if (values.cityOfResidence)
    fd.append('cityOfResidence', values.cityOfResidence);
  if (values.videoIntroUrl) {
    fd.append('videoIntroUrl', values.videoIntroUrl);
    fd.append('videoIntroSource', 'external');
  }
  if (values.portfolioUrl) fd.append('portfolioUrl', values.portfolioUrl);
  return fd;
}
