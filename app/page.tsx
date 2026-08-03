import type { Metadata } from "next";
import { FocusApp } from "./components/FocusApp";

export const metadata: Metadata = {
  title: "Doomsday Clock | Turn a deadline into a doable plan",
  description: "A friendly focus timer that turns a finish line into small, playable steps.",
};

export default function Home() {
  return <FocusApp />;
}
