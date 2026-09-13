import { redirect } from "next/navigation";

/** Legacy path. Setup now lives at /setup. */
export default function LegacySignupSetupPage() {
  redirect("/setup");
}
