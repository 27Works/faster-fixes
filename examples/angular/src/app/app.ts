import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ControlBar } from "./control-bar";

@Component({
  selector: "app-root",
  imports: [RouterLink, RouterOutlet, ControlBar],
  template: `
    <nav>
      <a routerLink="/">Home</a>
      <a routerLink="/second">Second page</a>
    </nav>
    <app-control-bar />
    <main>
      <router-outlet />
    </main>
  `,
})
export class App {}
