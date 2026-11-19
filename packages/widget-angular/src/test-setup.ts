// TestBed compiles its testing module just in time.
import "@angular/compiler";
import { TestBed } from "@angular/core/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";
import { afterEach } from "vitest";

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

// Without Vitest globals, TestBed cannot register its own reset hook.
afterEach(() => {
  TestBed.resetTestingModule();
});
