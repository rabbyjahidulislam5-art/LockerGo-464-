export function getEmailCredentials() {
  const user = process.env.EMAIL_USER || "rabbyjahidulislam5@gmail.com";
  const pass = process.env.EMAIL_PASS || "kkojhkctfoteerac";

  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS environment variables are required for SMTP email.");
  }

  return { user, pass };
}

export function getNodemailerSmtpConfig() {
  const { user, pass } = getEmailCredentials();

  return {
    service: "gmail",
    auth: {
      user,
      pass,
    },
  };
}