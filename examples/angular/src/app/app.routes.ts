import type { Routes } from "@angular/router";
import { HomePage } from "./pages/home-page";
import { SecondPage } from "./pages/second-page";

export const routes: Routes = [
  { path: "", component: HomePage },
  { path: "second", component: SecondPage },
];
