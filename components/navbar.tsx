"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
  Link,
} from "@heroui/react";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { NavbarUserMenu } from "@/components/navbar-user-menu";
import { useAuth } from "@/hooks/useAuth";
import { HeritLogo } from "@/components/HeritLogo";

export const Navbar = () => {
  const { user, isSessionLoading } = useAuth();
  const isOnboardingComplete = user?.onboarding_completed;

  return (
    <HeroUINavbar
      data-component-category="navigation"
      data-component-id="main-navbar"
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent
        className="basis-1/5 sm:basis-full justify-start items-center"
        data-component-category="ui"
        data-component-id="navbar-content"
      >
        <NavbarBrand
          as="li"
          className="gap-3 max-w-fit"
          data-component-category="ui"
          data-component-id="navbar-brand"
        >
          <NextLink
            className="flex justify-start items-center"
            data-component-category="ui"
            data-component-id="next-link"
            href="/"
          >
            <div className="mt-4">
              <HeritLogo
                data-component-category="ui"
                data-component-id="herit-logo"
                size={144}
              />
            </div>
          </NextLink>
        </NavbarBrand>
        {isOnboardingComplete && (
          <ul className="hidden lg:flex gap-4 justify-start ml-2 mt-4">
            {siteConfig.navItems.map((item) => (
              <NavbarItem
                key={item.href}
                data-component-category="ui"
                data-component-id="navbar-item"
              >
                <NextLink
                  className={clsx(
                    "text-foreground hover:text-primary transition-colors",
                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                  )}
                  color="foreground"
                  data-component-category="ui"
                  data-component-id="next-link"
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        )}
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full mt-4"
        data-component-category="ui"
        data-component-id="navbar-content"
        justify="end"
      >
        <NavbarItem
          className="hidden sm:flex gap-2"
          data-component-category="ui"
          data-component-id="navbar-item"
        >
          <ThemeSwitch
            data-component-category="ui"
            data-component-id="theme-switch"
          />
        </NavbarItem>
        <NavbarItem
          className="hidden md:flex"
          data-component-category="ui"
          data-component-id="navbar-item"
        >
          <NavbarUserMenu
            data-component-category="ui"
            data-component-id="navbar-user-menu"
          />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent
        className="sm:hidden basis-1 pl-4"
        data-component-category="ui"
        data-component-id="navbar-content"
        justify="end"
      >
        <ThemeSwitch
          data-component-category="ui"
          data-component-id="theme-switch"
        />
        <NavbarMenuToggle
          data-component-category="ui"
          data-component-id="navbar-menu-toggle"
        />
      </NavbarContent>

      <NavbarMenu data-component-category="ui" data-component-id="navbar-menu">
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {isOnboardingComplete &&
            siteConfig.navMenuItems.map((item, index) => (
              <NavbarMenuItem
                key={`${item}-${index}`}
                data-component-category="ui"
                data-component-id="navbar-menu-item"
              >
                <Link
                  as={NextLink}
                  color={
                    index === 2
                      ? "primary"
                      : index === siteConfig.navMenuItems.length - 1
                        ? "danger"
                        : "foreground"
                  }
                  href={item.href}
                  size="lg"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
