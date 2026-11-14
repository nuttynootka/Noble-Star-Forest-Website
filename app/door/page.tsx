import type { Metadata } from "next";
import { DoorDemo } from "./DoorDemo";
import "./door.css";

export const metadata: Metadata = { title: "Wreath Door Preview" };

export default function DoorPage() {
  return <DoorDemo />;
}
