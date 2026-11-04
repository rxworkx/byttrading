"use client";

import { useEffect, useRef } from "react";

// Google's widget owns its own DOM, so it lives in one element created outside
// React. Headers borrow that element while they are on screen. It stays loaded
// on pages without a header, so a chosen language carries across the whole site.
const SCRIPT_URL = "https://translate.google.com/translate_a/element.js?cb=bytTranslateInit";

declare global {
  interface Window {
    bytTranslateInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (options: { pageLanguage: string; autoDisplay: boolean }, id: string) => unknown;
      };
    };
  }
}

let host: HTMLDivElement | null = null;
let parking: HTMLDivElement | null = null;

function ensureWidget() {
  if (host && parking) return { host, parking };

  parking = document.createElement("div");
  parking.setAttribute("aria-hidden", "true");
  parking.style.cssText = "position:fixed;left:-9999px;top:0;";
  host = document.createElement("div");
  host.id = "byt-translate-host";
  parking.appendChild(host);
  document.body.appendChild(parking);

  tolerateTranslatedDom();
  window.bytTranslateInit = () => {
    new window.google!.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "byt-translate-host");
  };
  const script = document.createElement("script");
  script.src = SCRIPT_URL;
  script.async = true;
  document.body.appendChild(script);

  return { host, parking };
}

// Translating moves text into new elements, so React can later try to remove a
// node from a parent that no longer holds it, which would crash the page.
function tolerateTranslatedDom() {
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };
  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, reference: Node | null): T {
    if (reference && reference.parentNode !== this) return node;
    return insertBefore.call(this, node, reference) as T;
  };
}

/** Rendered once in the root layout, so the widget is available on every page. */
export function TranslateLoader() {
  useEffect(() => {
    ensureWidget();
  }, []);
  return null;
}

/** Positioned by the header, and takes no space in its layout. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = slot.current;
    if (!element) return;
    const widget = ensureWidget();
    element.appendChild(widget.host);
    return () => {
      if (widget.host.parentElement === element) widget.parking.appendChild(widget.host);
    };
  }, []);

  return <div ref={slot} className={`byt-translate notranslate z-10 h-5 w-[132px] ${className ?? ""}`} />;
}
