import React from "react";
import { createRoot } from "react-dom/client";
import { Theme } from "@astryxdesign/core/theme";
import { Heading } from "@astryxdesign/core/Heading";
import { Button } from "@astryxdesign/core/Button";
import { themes, defaultThemeSlug } from "../astryx-themes";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";

function Hero() {
  return (
    <Theme theme={themes[defaultThemeSlug]}>
      <section className="hero">
        <div>
          <Heading level={1} type="display-1">
            Plan a pub crawl near you.
          </Heading>
          <p>
            Choose a starting place and a radius. Roundabout finds nearby pubs
            and arranges up to six stops in a route you can edit.
          </p>
          <div className="hero-actions">
            <Button
              label="Choose a starting place"
              variant="primary"
              onClick={() => document.getElementById("location").focus()}
            />
          </div>
        </div>
        <aside className="hero-aside">
          <strong>Know before you go</strong>
          <p>
            Pub details and ratings come from OpenStreetMap. Check opening hours
            and accessibility with each venue.
          </p>
        </aside>
      </section>
    </Theme>
  );
}
createRoot(document.getElementById("hero-root")).render(<Hero />);
import("./app.js").catch(() => {
  document.getElementById("status").textContent =
    "The map could not load. Refresh to try again.";
});
