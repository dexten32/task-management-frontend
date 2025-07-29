import clsx from "clsx";
import { Link } from "lucide-react";
import { usePathname } from "next/navigation";

export function SidebarLink({
  href,
  icon,
  label,
  sidebarOpen,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sidebarOpen: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div
        className={clsx(
          "flex items-center p-4 cursor-pointer",
          isActive
            ? "bg-slate-100 text-gray-800"
            : "hover:bg-slate-100 text-slate-100 hover:text-gray-800"
        )}
      >
        <div className="h-5 w-5">{icon}</div>
        {sidebarOpen && <span className="ml-3">{label}</span>}
      </div>
    </Link>
  );
}
