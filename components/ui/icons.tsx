import { icons as LucideIcons } from 'lucide-react'

export type Icon = typeof LucideIcons

export const Icons = {
  ...LucideIcons,
  spinner: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  microsoft: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4h2v2H4z" fill="currentColor" />
      <path d="M10 4h2v2h-2z" fill="currentColor" />
      <path d="M4 10h2v2H4z" fill="currentColor" />
      <path d="M10 10h2v2h-2z" fill="currentColor" />
      <path d="M16 4h2v2h-2z" stroke="currentColor" fill="none" />
      <path d="M16 10h2v2h-2z" stroke="currentColor" fill="none" />
      <path d="M4 16h2v2H4z" stroke="currentColor" fill="none" />
      <path d="M10 16h2v2h-2z" stroke="currentColor" fill="none" />
      <path d="M16 16h2v2h-2z" stroke="currentColor" fill="none" />
    </svg>
  ),
}