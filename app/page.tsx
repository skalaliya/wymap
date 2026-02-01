import { redirect } from "next/navigation";

export default function Home() {
  redirect("/kiosk/ready");
  redirect("/kiosk");
}
