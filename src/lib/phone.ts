import { z } from 'zod';

const FORMATTED_INTERNATIONAL_PHONE_PATTERN = /^\+[1-9][\d\s().-]*$/;
const E164_PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;
const PHONE_FORMAT_ERROR = 'Enter an international phone number with a country code, such as +92 300 1234567.';

export const internationalPhoneSchema = z
  .string()
  .trim()
  .regex(FORMATTED_INTERNATIONAL_PHONE_PATTERN, PHONE_FORMAT_ERROR)
  .transform(phone => phone.replaceAll(/[\s().-]/g, ''))
  .pipe(z.string().regex(E164_PHONE_PATTERN, PHONE_FORMAT_ERROR));
