const THEME_KEY = "theme";

function applyTheme(theme) {
  if (theme) {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function initThemeToggle() {
  const stored = localStorage.getItem(THEME_KEY);
  applyTheme(stored);

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = document.documentElement.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}

function openLightbox(src, alt) {
  const lightboxImg = document.getElementById("lightbox-img");
  lightboxImg.src = src;
  lightboxImg.alt = alt || "";
  document.getElementById("lightbox").hidden = false;
}

function closeLightbox() {
  document.getElementById("lightbox").hidden = true;
}

function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (evt) => {
    if (evt.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape") closeLightbox();
  });
}

function niceMax(value) {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let step;
  if (normalized <= 1) step = 1;
  else if (normalized <= 2) step = 2;
  else if (normalized <= 5) step = 5;
  else step = 10;
  return step * magnitude;
}

function renderChart(series) {
  const svg = document.getElementById("citation-chart");
  const width = 700;
  const height = 280;
  const margin = { top: 16, right: 16, bottom: 32, left: 44 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const maxVal = niceMax(Math.max(...series.map((d) => d.cumulative)));
  const xFor = (i) => margin.left + (i / (series.length - 1)) * plotW;
  const yFor = (v) => margin.top + plotH - (v / maxVal) * plotH;

  const ns = "http://www.w3.org/2000/svg";
  const el = (tag, attrs) => {
    const node = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };

  svg.innerHTML = "";

  // gridlines + y ticks (0, mid, max)
  [0, 0.5, 1].forEach((frac) => {
    const v = maxVal * frac;
    const y = yFor(v);
    svg.appendChild(
      el("line", { x1: margin.left, x2: width - margin.right, y1: y, y2: y, class: frac === 0 ? "baseline" : "gridline" })
    );
    const label = el("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end", class: "axis-label" });
    label.textContent = Math.round(v).toLocaleString();
    svg.appendChild(label);
  });

  // x ticks (years)
  series.forEach((d, i) => {
    const label = el("text", { x: xFor(i), y: height - margin.bottom + 20, "text-anchor": "middle", class: "axis-label" });
    label.textContent = d.year;
    svg.appendChild(label);
  });

  // area
  const areaPoints = series.map((d, i) => `${xFor(i)},${yFor(d.cumulative)}`).join(" L ");
  const areaPath = `M ${xFor(0)},${yFor(0)} L ${areaPoints} L ${xFor(series.length - 1)},${yFor(0)} Z`;
  svg.appendChild(el("path", { d: areaPath, class: "chart-area" }));

  // line
  const linePoints = series.map((d, i) => `${xFor(i)},${yFor(d.cumulative)}`).join(" L ");
  svg.appendChild(el("path", { d: `M ${linePoints}`, class: "chart-line" }));

  // dots
  series.forEach((d, i) => {
    svg.appendChild(el("circle", { cx: xFor(i), cy: yFor(d.cumulative), r: 4, class: "chart-dot" }));
  });

  // crosshair
  const crosshair = el("line", { x1: 0, x2: 0, y1: margin.top, y2: margin.top + plotH, class: "crosshair" });
  svg.appendChild(crosshair);

  // hit areas (one per year, full plot height)
  const tooltip = document.getElementById("tooltip");
  series.forEach((d, i) => {
    const bandW = plotW / series.length;
    const bandX = margin.left + i * bandW;
    const hit = el("rect", { x: bandX, y: margin.top, width: bandW, height: plotH, class: "hit-area" });
    hit.addEventListener("pointerenter", () => showTooltip(d, i));
    hit.addEventListener("pointermove", (evt) => positionTooltip(evt));
    hit.addEventListener("pointerleave", hideTooltip);
    svg.appendChild(hit);
  });

  function showTooltip(d, i) {
    crosshair.setAttribute("x1", xFor(i));
    crosshair.setAttribute("x2", xFor(i));
    crosshair.style.opacity = "1";
    tooltip.innerHTML = "";
    const value = document.createElement("div");
    value.className = "tooltip-value";
    value.textContent = `${d.cumulative.toLocaleString()} citations`;
    const label = document.createElement("div");
    label.className = "tooltip-label";
    label.textContent = `${d.year} (+${d.citations} that year)`;
    tooltip.appendChild(value);
    tooltip.appendChild(label);
    tooltip.style.opacity = "1";
  }

  function positionTooltip(evt) {
    tooltip.style.left = `${evt.clientX + 14}px`;
    tooltip.style.top = `${evt.clientY + 14}px`;
  }

  function hideTooltip() {
    crosshair.style.opacity = "0";
    tooltip.style.opacity = "0";
  }
}

function renderStats(series) {
  const total = series[series.length - 1].cumulative;
  const latest = series[series.length - 1];
  document.getElementById("stat-total").textContent = total.toLocaleString();
  document.getElementById("stat-latest").textContent = latest.citations.toLocaleString();
  document.getElementById("stat-latest-year").textContent = latest.year;
}

function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target).classList.add("active");
    });
  });
}

function renderProfile(profile) {
  if (profile.draft) {
    document.getElementById("draft-banner").hidden = false;
  }

  document.getElementById("bio").textContent = profile.summary || "";

  const educationList = document.getElementById("education-list");
  educationList.innerHTML = "";
  (profile.education || []).forEach((ed) => {
    const card = document.createElement("div");
    card.className = "timeline-item";

    const heading = document.createElement("div");
    heading.className = "timeline-heading";
    const degree = document.createElement("span");
    degree.className = "timeline-role";
    degree.textContent = [ed.degree, ed.field].filter(Boolean).join(", ");
    const dates = document.createElement("span");
    dates.className = "timeline-dates";
    dates.textContent = [ed.start, ed.end].filter(Boolean).join(" – ");
    heading.appendChild(degree);
    heading.appendChild(dates);
    card.appendChild(heading);

    const org = document.createElement("div");
    org.className = "timeline-org";
    org.textContent = ed.institution || "";
    card.appendChild(org);

    educationList.appendChild(card);
  });
}

function renderProjects(projects, pubs) {
  const container = document.getElementById("projects-list");
  container.innerHTML = "";

  const pubsByDoi = new Map(pubs.map((p) => [p.doi, p]));

  (projects || []).forEach((proj) => {
    const card = document.createElement("div");
    card.className = "project";

    const title = document.createElement("h3");
    title.className = "project-title";
    title.textContent = proj.name || "";
    card.appendChild(title);

    if (proj.affiliation) {
      const affiliation = document.createElement("p");
      affiliation.className = "project-affiliation";
      affiliation.textContent = proj.affiliation;
      card.appendChild(affiliation);
    }

    const body = document.createElement("div");
    body.className = "project-body";

    const figure = document.createElement("div");
    figure.className = "project-figure";
    if (proj.figure) {
      const img = document.createElement("img");
      img.src = proj.figure;
      img.alt = proj.name ? `${proj.name} figure` : "Project figure";
      img.addEventListener("click", () => openLightbox(img.src, img.alt));
      figure.appendChild(img);
    } else {
      figure.classList.add("is-placeholder");
      figure.setAttribute("aria-hidden", "true");
      const figureLabel = document.createElement("span");
      figureLabel.textContent = "Abstract figure placeholder";
      figure.appendChild(figureLabel);
    }
    body.appendChild(figure);

    const details = document.createElement("div");
    details.className = "project-details";

    const summary = document.createElement("p");
    summary.className = "project-summary";
    summary.textContent = proj.summary || "";
    details.appendChild(summary);

    if (proj.skills && proj.skills.length) {
      const skillsHeading = document.createElement("h4");
      skillsHeading.className = "project-subheading";
      skillsHeading.textContent = "Skills used";
      details.appendChild(skillsHeading);

      const skillsList = document.createElement("ul");
      skillsList.className = "skills-list";
      proj.skills.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        skillsList.appendChild(li);
      });
      details.appendChild(skillsList);
    }

    if (proj.publications && proj.publications.length) {
      const pubsHeading = document.createElement("h4");
      pubsHeading.className = "project-subheading";
      pubsHeading.textContent = "Related publications";
      details.appendChild(pubsHeading);

      const pubsList = document.createElement("ul");
      pubsList.className = "project-pubs-list";
      proj.publications.forEach((doi) => {
        const pub = pubsByDoi.get(doi);
        const li = document.createElement("li");
        if (pub) {
          const link = document.createElement("a");
          link.href = doi;
          link.target = "_blank";
          link.rel = "noopener";
          link.textContent = pub.title;
          li.appendChild(link);
          const year = document.createElement("span");
          year.className = "project-pub-year";
          year.textContent = ` (${pub.year})`;
          li.appendChild(year);
        } else {
          li.textContent = doi;
        }
        pubsList.appendChild(li);
      });
      details.appendChild(pubsList);
    }

    body.appendChild(details);
    card.appendChild(body);
    container.appendChild(card);
  });
}

function renderCollaborations(collaborations, pubs) {
  const container = document.getElementById("collaborations-list");
  container.innerHTML = "";

  const pubsByDoi = new Map(pubs.map((p) => [p.doi, p]));

  (collaborations || []).forEach((collab) => {
    const card = document.createElement("div");
    card.className = "collaboration";

    const title = document.createElement("h3");
    title.className = "collaboration-title";
    title.textContent = collab.name || "";
    card.appendChild(title);

    if (collab.collaborator) {
      const collaborator = document.createElement("p");
      collaborator.className = "collaboration-collaborator";
      collaborator.textContent = collab.collaborator;
      card.appendChild(collaborator);
    }

    if (collab.summary) {
      const summary = document.createElement("p");
      summary.className = "collaboration-summary";
      summary.textContent = collab.summary;
      card.appendChild(summary);
    }

    if (collab.publications && collab.publications.length) {
      const pubsHeading = document.createElement("h4");
      pubsHeading.className = "project-subheading";
      pubsHeading.textContent = "Related publications";
      card.appendChild(pubsHeading);

      const pubsList = document.createElement("ul");
      pubsList.className = "project-pubs-list";
      collab.publications.forEach((doi) => {
        const pub = pubsByDoi.get(doi);
        const li = document.createElement("li");
        if (pub) {
          const link = document.createElement("a");
          link.href = doi;
          link.target = "_blank";
          link.rel = "noopener";
          link.textContent = pub.title;
          li.appendChild(link);
          const year = document.createElement("span");
          year.className = "project-pub-year";
          year.textContent = ` (${pub.year})`;
          li.appendChild(year);
        } else {
          li.textContent = doi;
        }
        pubsList.appendChild(li);
      });
      card.appendChild(pubsList);
    }

    container.appendChild(card);
  });
}

function renderPublications(pubs) {
  const container = document.getElementById("publications-list");
  container.innerHTML = "";

  pubs.forEach((p) => {
    const card = document.createElement("div");
    card.className = "paper";

    const title = document.createElement("p");
    title.className = "paper-title";
    if (p.doi) {
      const link = document.createElement("a");
      link.href = p.doi;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = p.title;
      title.appendChild(link);
    } else {
      title.textContent = p.title;
    }
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "paper-meta";
    const year = document.createElement("span");
    year.className = "paper-year";
    year.textContent = p.year;
    const venue = document.createElement("span");
    venue.textContent = p.venue || "";
    const type = document.createElement("span");
    type.className = "paper-type";
    type.textContent = p.type || "";
    meta.appendChild(year);
    meta.appendChild(venue);
    meta.appendChild(type);
    card.appendChild(meta);

    container.appendChild(card);
  });
}

async function init() {
  initThemeToggle();
  initTabs();
  initLightbox();
  const [pubs, citations, profile] = await Promise.all([
    fetch("data/publications.json").then((r) => r.json()),
    fetch("data/citations.json").then((r) => r.json()),
    fetch("data/profile.json").then((r) => r.json()),
  ]);
  renderProfile(profile);
  renderProjects(profile.projects, pubs);
  renderCollaborations(profile.collaboration, pubs);
  renderStats(citations);
  renderChart(citations);
  renderPublications(pubs);
}

init();
