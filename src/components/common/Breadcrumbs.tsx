import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center flex-wrap gap-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4"
    >
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-[#2391C3] dark:hover:text-[#5BB3D8] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
