import { useParams } from "react-router";

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();

  return <main className="app-shell">Movie id: {id}</main>;
}