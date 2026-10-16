"use client";

import { Moon, Sun } from "@/components/icons";

export function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Basculer le mode sombre"
      className="ml-2 flex size-[30px] flex-none cursor-pointer items-center justify-center rounded-full bg-white text-[#1d2a26] shadow-[0_2px_8px_#00000022] dark:bg-card dark:text-gold"
    >
      <Moon className="size-[15px] dark:hidden" />
      <Sun className="hidden size-[15px] dark:block" />
    </button>
  );
}
