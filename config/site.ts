export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Herit",
  description: "Estate Planning Made Simple. Create and manage your will with professional estate planning tools. Secure, legal, and easy to use.",
  navItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Assets",
      href: "/assets",
    },
    {
      label: "Beneficiaries",
      href: "/beneficiaries",
    },
    {
      label: "Will",
      href: "/will",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Assets",
      href: "/assets",
    },
    {
      label: "Beneficiaries",
      href: "/beneficiaries",
    },
    {
      label: "Will",
      href: "/will",
    },
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Support",
      href: "/help",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/herit-app/herit",
    twitter: "https://twitter.com/heritapp",
    docs: "https://docs.herit.app",
    discord: "https://discord.gg/herit",
    sponsor: "https://herit.app/sponsor",
  },
};
