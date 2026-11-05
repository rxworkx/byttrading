"use client";

import { useEffect } from "react";

// GTranslate's floating widget owns its own DOM, so it lives in one element
// created outside React. It stays loaded on every page, so a chosen language
// carries across the whole site.
const SCRIPT_URL = "https://cdn.gtranslate.net/widgets/latest/float.js";

const SETTINGS = {
  default_language: "en",
  languages: ["af", "sq", "am", "ar", "hy", "az", "eu", "be", "bn", "bs", "bg", "ca", "ceb", "ny", "zh-CN", "zh-TW", "co", "hr", "cs", "da", "nl", "en", "eo", "et", "tl", "fi", "fr", "fy", "gl", "ka", "de", "el", "gu", "ht", "ha", "haw", "iw", "hi", "hmn", "hu", "is", "ig", "id", "ga", "it", "ja", "jw", "kn", "kk", "km", "ko", "ku", "ky", "lo", "la", "lv", "lt", "lb", "mk", "mg", "ms", "ml", "mt", "mi", "mr", "mn", "my", "ne", "no", "ps", "fa", "pl", "pt", "pa", "ro", "ru", "sm", "gd", "sr", "st", "sn", "sd", "si", "sk", "sl", "so", "es", "su", "sw", "sv", "tg", "ta", "te", "th", "tr", "uk", "ur", "uz", "vi", "cy", "xh", "yi", "yo", "zu"],
  url_structure: "none",
  flag_style: "2d",
  flag_size: 16,
  wrapper_selector: ".gtranslate_wrapper",
  native_language_names: true,
  detect_browser_language: true,
  switcher_open_direction: "top",
  switcher_horizontal_position: "right",
  switcher_vertical_position: "top",
  switcher_text_color: "#666",
  switcher_arrow_color: "#666",
  switcher_border_color: "#ccc",
  switcher_background_color: "#fff",
  switcher_background_shadow_color: "#efefef",
  switcher_background_hover_color: "#fff",
  dropdown_text_color: "#000",
  dropdown_hover_color: "#fff",
  dropdown_background_color: "#eee"
};

declare global {
  interface Window {
    gtranslateSettings?: typeof SETTINGS;
  }
}

let loaded = false;

function loadWidget() {
  if (loaded) return;
  loaded = true;

  tolerateTranslatedDom();

  const wrapper = document.createElement("div");
  wrapper.className = "gtranslate_wrapper notranslate";
  document.body.appendChild(wrapper);

  window.gtranslateSettings = SETTINGS;
  const script = document.createElement("script");
  script.src = SCRIPT_URL;
  script.defer = true;
  document.body.appendChild(script);
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
    loadWidget();
  }, []);
  return null;
}
