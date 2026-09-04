/** Vendored from the scroll-world skill, with two local extensions:
 *  a `detail` slot rendered verbatim, and an ES module export. */
export type ScrollWorldSection = {
  id: string;
  label?: string;
  still?: string;
  stillMobile?: string;
  clip?: string;
  clipMobile?: string;
  accent?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  tags?: string[];
  /** Raw HTML. Escape everything that comes from data before it gets here. */
  detail?: string;
  scroll?: number;
  linger?: number;
  cta?: {
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
};

export type ScrollWorldConfig = {
  brand?: { name?: string; href?: string };
  diveScroll?: number;
  connScroll?: number;
  crossfade?: number;
  hint?: string;
  nav?: boolean;
  atmosphere?: boolean;
  sections: ScrollWorldSection[];
  connectors?: (string | null)[];
  connectorsMobile?: (string | null)[];
};

declare function mountScrollWorld(
  container: HTMLElement,
  config: ScrollWorldConfig,
): void;

export default mountScrollWorld;
export { mountScrollWorld };
