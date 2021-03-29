/**
 * Routes for the Shape The Pixel project:
 *
 * `/about` - Small about page: should redirect to somewhere else with more info
 * `/profile/$userId` - User profile page
 * `/profile/$userId/projects` - User projects
 * `/profile/$userId/projects/$randomId` - User private projects
 * `/` - Creates a new project and reroutes to "/$randomId" in editing mode
 * `/$randomId` - Views a project, has two views:
 *                - Project being edited (shows users cursors and allows joining)
 *                - Project published (shows controls like play, stop, etc)
 */
export enum Route {
  About = "/about",
  Profile = "/profile/$userId",
  Projects = "/profile/$userId/projects",
  PrivateProject = "/profile/$userId/projects/$projectId",
  View = "/$projectId",
}
export class Router {
  at = Route.View;
  params: Map<string, string> | undefined = undefined;
  parseLocation(location: string) {
    // Sets the "at" and "params"
  }
  changeLocationTo(location: string) {
    // Parses the location string and adjusts the URL location, and calls
    // the onRouteChange function if it is defined
  }
}
