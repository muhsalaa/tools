import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { HomePage } from "./pages/HomePage";
import { NotesPage } from "./pages/NotesPage";
import { PomodoroPage } from "./pages/PomodoroPage";

function Shell() {
  return (
    <div className="min-h-dvh bg-[#D9EFE4] text-[#173E3A]">
      <Outlet />
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
