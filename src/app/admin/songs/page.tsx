import { redirect } from "next/navigation";

export default function AdminSongsPage() {
  redirect("/admin?tab=songs");
}
