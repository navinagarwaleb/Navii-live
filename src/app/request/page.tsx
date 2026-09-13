import { redirect } from "next/navigation";

/** Legacy route for the default performer request flow. */
export default function RequestRedirectPage() {
  redirect("/navii/request");
}
