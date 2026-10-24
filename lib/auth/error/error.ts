export type LoginErrorCode =
  | "invalid_link"
  | "verification_failed"
  | "server_error"
  | "over_request_rate_limit"
  | "over_email_send_rate_limit";

interface LoginErrorDetails {
  title: string;
  description: string;
}

export const loginError: Record<LoginErrorCode, LoginErrorDetails> = {
  invalid_link: {
    title: "Link expired or invalid",
    description: "Request a new sign-in link to continue.",
  },
  verification_failed: {
    title: "Unable to sign in",
    description: "We couldn’t verify your sign-in link. Please try again.",
  },
  server_error: {
    title: "Something went wrong",
    description: "Please try again later.",
  },
  over_request_rate_limit: {
    title: "Too many requests",
    description: "Please wait to try again",
  },
  over_email_send_rate_limit: {
    title: "Too many email requests",
    description: "Please wait to ask for a new verification email",
  },
};
