import { redirect } from "next/navigation";

/** Legacy route — default performer request flow. */
export default function RequestRedirectPage() {
  redirect("/navii/request");
}
