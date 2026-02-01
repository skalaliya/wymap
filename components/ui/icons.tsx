import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const baseProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const DashboardIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <path d="M3 12h8V3H3z" />
    <path d="M13 21h8v-8h-8z" />
    <path d="M13 3h8v8h-8z" />
    <path d="M3 13h8v8H3z" />
  </svg>
);

export const UsersIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <path d="M16 11a4 4 0 1 0-8 0" />
    <path d="M4 20a6 6 0 0 1 16 0" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const SiteIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <path d="M3 10l9-7 9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

export const DeviceIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <rect x="4" y="3" width="16" height="12" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 15v6" />
  </svg>
);

export const TimeIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export const CheckIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export const ReportIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <path d="M4 4h16v16H4z" />
    <path d="M8 16v-5" />
    <path d="M12 16V8" />
    <path d="M16 16v-3" />
  </svg>
);

export const AlertIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M5 19h14l-7-14z" />
  </svg>
);

export const LogoutIcon = ({ size = 18, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const SearchIcon = ({ size = 18, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const ChevronRightIcon = ({ size = 16, ...props }: IconProps) => (
  <svg {...baseProps(size)} {...props}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
