import { Redirect } from "expo-router";
import { useUserStore } from "../store/userStore";

export default function Index() {
  const user = useUserStore((s) => s.user);
  return <Redirect href={user ? "/dashboard" : "/welcome"} />;
}
