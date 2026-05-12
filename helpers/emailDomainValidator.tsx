// List of blocked fake/disposable email domains
export const BLOCKED_EMAIL_DOMAINS = [
  // Test/Example domains
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  // Disposable email providers
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.info",
  "tempmail.com",
  "throwaway.email",
  "fakeinbox.com",
  "sharklasers.com",
  "trashmail.com",
  "getnada.com",
  "temp-mail.org",
  "10minutemail.com",
  "10minutemail.net",
  "yopmail.com",
  "dispostable.com",
  "maildrop.cc",
  "mailcatch.com",
  "emailondeck.com",
  "mintemail.com",
  "mytrashmail.com",
  "guerrillamailblock.com",
  "spam4.me",
  "mailnesia.com",
  "trashmail.net",
  "throwawaymail.com",
  "mohmal.com",
  "spambox.us",
  "mailexpire.com",
  "mailforspam.com",
  "spamgourmet.com",
  "tempinbox.com",
  "jetable.org",
  "tempr.email",
  "emailtemporanea.com",
  "disposablemail.com",
  "guerrillamail.com",
];

export const EMAIL_DOMAIN_ERROR_MESSAGE =
  "Please use a valid email address. Disposable or fake email domains are not allowed.";

/**
 * Validates that an email address does not use a blocked domain
 * @param email - The email address to validate
 * @returns true if email is valid (not using blocked domain), false otherwise
 */
export function isEmailDomainValid(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split("@")[1];

  if (!domain) {
    return false;
  }

  return !BLOCKED_EMAIL_DOMAINS.includes(domain);
}