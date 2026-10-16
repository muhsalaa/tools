import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { StartBar } from "./components/StartBar";
import { HomePage } from "./pages/HomePage";
import { NotesPage } from "./pages/NotesPage";
import { PomodoroPage } from "./pages/PomodoroPage";

// Hallmark · design-system: design.md · Window shell on CSS wallpaper.
function Shell() {
  return (
    <div
      className="min-h-dvh bg-[#D9EFE4] text-[#173E3A]"
      style={{
        backgroundImage:
          "radial-gradient(60% 40% at 80% 10%, rgba(244,251,247,.9), transparent 70%), radial-gradient(50% 35% at 15% 85%, rgba(31,157,138,.18), transparent 70%)",
      }}
    >
      <Outlet />
      <StartBar />
    </div>
  );
}

const rootRoute = createRootRoute({ component: Shell });

const homeRoute = createRoute({
  component: HomePage,
  getParentRoute: () => rootRoute,
  path: "/",
});

const pomodoroRoute = createRoute({
  component: PomodoroPage,
  getParentRoute: () => rootRoute,
  path: "/pomodoro",
});

const notesRoute = createRoute({
  component: NotesPage,
  getParentRoute: () => rootRoute,
  path: "/notes",
});

const routeTree = rootRoute.addChildren([homeRoute, pomodoroRoute, notesRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
