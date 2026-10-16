import { Link } from "@tanstack/react-router";

export function HomeButton() {
  return (
    <Link
      aria-label="Back to home"
      className="inline-flex items-center gap-2 rounded-full bg-[#173E3A] px-5 py-2 text-sm font-semibold text-[#D9EFE4] transition hover:opacity-90"
      to="/"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
      Home
    </Link>
  );
}
