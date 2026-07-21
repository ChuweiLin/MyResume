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

function renderProfile(profile) {
  if (profile.draft) {
    document.getElementById("draft-banner").hidden = false;
  }

  document.getElementById("summary-text").textContent = profile.summary || "";

  const skillsList = document.getElementById("skills-list");
  skillsList.innerHTML = "";
  (profile.skills || []).forEach((skill) => {
    const li = document.createElement("li");
    li.textContent = skill;
    skillsList.appendChild(li);
  });

  const experienceList = document.getElementById("experience-list");
  experienceList.innerHTML = "";
  (profile.experience || []).forEach((job) => {
    const card = document.createElement("div");
    card.className = "timeline-item";

    const heading = document.createElement("div");
    heading.className = "timeline-heading";
    const role = document.createElement("span");
    role.className = "timeline-role";
    role.textContent = job.role || "";
    const dates = document.createElement("span");
    dates.className = "timeline-dates";
    dates.textContent = [job.start, job.end].filter(Boolean).join(" – ");
    heading.appendChild(role);
    heading.appendChild(dates);
    card.appendChild(heading);

    const org = document.createElement("div");
    org.className = "timeline-org";
    org.textContent = job.org || "";
    card.appendChild(org);

    if (job.bullets && job.bullets.length) {
      const ul = document.createElement("ul");
      job.bullets.forEach((b) => {
        const li = document.createElement("li");
        li.textContent = b;
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }

    experienceList.appendChild(card);
  });

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

function renderPublications(pubs) {
  const container = document.getElementById("publications-list");
  container.innerHTML = "";

  const byYear = new Map();
  pubs.forEach((p) => {
    if (!byYear.has(p.year)) byYear.set(p.year, []);
    byYear.get(p.year).push(p);
  });

  const years = Array.from(byYear.keys()).sort((a, b) => b - a);
  years.forEach((year) => {
    const group = document.createElement("div");
    group.className = "year-group";

    const heading = document.createElement("h3");
    heading.className = "year-heading";
    heading.textContent = year;
    group.appendChild(heading);

    byYear.get(year).forEach((p) => {
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
      const venue = document.createElement("span");
      venue.textContent = p.venue || "";
      const type = document.createElement("span");
      type.className = "paper-type";
      type.textContent = p.type || "";
      meta.appendChild(venue);
      meta.appendChild(type);
      card.appendChild(meta);

      group.appendChild(card);
    });

    container.appendChild(group);
  });
}

async function init() {
  initThemeToggle();
  const [pubs, citations, profile] = await Promise.all([
    fetch("data/publications.json").then((r) => r.json()),
    fetch("data/citations.json").then((r) => r.json()),
    fetch("data/profile.json").then((r) => r.json()),
  ]);
  renderProfile(profile);
  renderStats(citations);
  renderChart(citations);
  renderPublications(pubs);
}

init();
