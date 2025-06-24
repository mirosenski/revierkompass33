import { Eye, Leaf, Monitor, Moon, Sun, Zap } from "lucide-react"; // Added new icons
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "dark" | "light" | "system" | "eco" | "highContrast" | "auto";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme;
    return storedTheme || defaultTheme;
  });

  const [_themeChange, setThemeChange] = useState(0);

  // Theme anwenden Funktion mit useCallback
  const applyEffectiveTheme = useCallback((newTheme: string) => {
    const effectiveTheme = newTheme === "system" || newTheme === "auto" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : newTheme;

    if (effectiveTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, []);

  // Theme anwenden wenn sich das Theme ändert
  useEffect(() => {
    applyEffectiveTheme(theme);
  }, [theme, applyEffectiveTheme]);

  // System theme change listener für "system" und "auto" Themes
  useEffect(() => {
    if (theme === "system" || theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = () => {
        applyEffectiveTheme(theme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, applyEffectiveTheme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
      setThemeChange((prev) => prev + 1); // Trigger animation
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [hover, setHover] = useState(false);
  const [_themeChange, _setThemeChange] = useState(0);

  // Microinteraction animation
  useEffect(() => {
    const timer = setTimeout(() => {
      const button = document.querySelector(".theme-toggle-button");
      if (button) {
        button.classList.add("animate-pulse");
        setTimeout(() => button.classList.remove("animate-pulse"), 300);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Funktion zum Anzeigen des korrekten Icons basierend auf dem effektiven Theme
  const getEffectiveThemeIcon = () => {
    const root = window.document.documentElement;
    const isDark = root.classList.contains("dark");
    const isEco = root.classList.contains("eco");
    const isHighContrast = root.classList.contains("highContrast");

    if (isEco) return <Leaf className="h-[1.2rem] w-[1.2rem]" />;
    if (isHighContrast) return <Eye className="h-[1.2rem] w-[1.2rem]" />;
    if (theme === "auto") return <Zap className="h-[1.2rem] w-[1.2rem]" />;
    if (theme === "system") return <Monitor className="h-[1.2rem] w-[1.2rem]" />;

    // Für light/dark zeigen wir Sonne/Mond basierend auf dem effektiven Theme
    return (
      <>
        <Sun
          className={`h-[1.2rem] w-[1.2rem] transition-all ${isDark ? "scale-0 -rotate-90" : "scale-100 rotate-0"}`}
        />
        <Moon
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? "scale-100 rotate-0" : "scale-0 rotate-90"}`}
        />
      </>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`theme-toggle-button transition-all duration-300 
            ${hover ? "shadow-lg shadow-blue-500/20" : "shadow-md"}
            hover:shadow-blue-500/30 border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-700`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {getEffectiveThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-1"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
        >
          <Sun className="mr-3 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
        >
          <Moon className="mr-3 h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
        >
          <Monitor className="mr-3 h-4 w-4" /> System
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("eco")}
          className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
        >
          <Leaf className="mr-3 h-4 w-4" /> Eco Mode
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("highContrast")}
          className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
        >
          <Eye className="mr-3 h-4 w-4" /> High Contrast
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("auto")}
          className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
        >
          <Zap className="mr-3 h-4 w-4" /> Auto (AI)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
