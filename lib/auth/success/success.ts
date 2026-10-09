export type LoginSuccessCode = "email_sent"

interface LoginSuccessDetails {
  title: string,
  description: string,
}

export const loginSuccess : Record<LoginSuccessCode, LoginSuccessDetails> = {
  email_sent: {
    title: "Email verification sent",
    description: "Please check your inbox.",
  },
};