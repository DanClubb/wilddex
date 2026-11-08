// Password rules shared by the sign-up form and the server action.
// Keep MIN_PASSWORD in step with the minimum password length set in Supabase
// (Authentication → Sign In / Providers → Email). 72 is the most the
// password hashing accepts.
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72;
