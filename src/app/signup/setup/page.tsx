import { redirect } from "next/navigation";

/** Legacy path — setup now lives at /setup. */
export default function LegacySignupSetupPage() {
  redirect("/setup");
}
