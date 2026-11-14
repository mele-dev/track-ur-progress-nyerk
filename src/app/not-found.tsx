import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-bold text-gold">404</p>
      <p className="mt-2 text-muted">No encontramos esta página · Page not found</p>
      <Link href="/" className="mt-4 inline-block rounded-xl bg-gold px-4 py-2 font-semibold text-black">
        ← Inicio / Home
      </Link>
    </div>
  );
}
