const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initThemeToggle() {
  const button = document.querySelector("[data-theme-toggle]");
  const label = document.querySelector("[data-theme-label]");
  const themeColor = document.querySelector("[data-theme-color]");
  if (!(button instanceof HTMLButtonElement) || !(label instanceof HTMLElement)) return;
  const system = window.matchMedia("(prefers-color-scheme: light)");
  const stored = () => {
    try {
      return localStorage.getItem("basil-theme");
    } catch {
      return null;
    }
  };
  const apply = (theme) => {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    label.textContent = next === "dark" ? "Light" : "Dark";
    button.setAttribute("aria-label", `Switch to ${next === "dark" ? "light" : "dark"} theme`);
    if (themeColor instanceof HTMLMetaElement) {
      const background = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
      if (background) themeColor.content = background;
    }
  };
  apply(document.documentElement.dataset.theme || stored() || (system.matches ? "light" : "dark"));
  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    apply(next);
    try {
      localStorage.setItem("basil-theme", next);
    } catch {
      return;
    }
  });
  system.addEventListener?.("change", (event) => {
    if (!stored()) apply(event.matches ? "light" : "dark");
  });
}

function initReveal() {
  const elements = [...document.querySelectorAll("[data-reveal]")];
  if (!elements.length) return;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -9%", threshold: 0.08 });
  elements.forEach((element) => observer.observe(element));
}

function initCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy");
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        const label = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = label;
        }, 1200);
      } catch {
        window.location.href = `mailto:${value}`;
      }
    });
  });
}

function initProjectFilter() {
  const input = document.querySelector("[data-filter-input]");
  const status = document.querySelector("[data-filter-status]");
  const rows = [...document.querySelectorAll("[data-filter-row]")];
  const empty = document.querySelector("[data-filter-empty]");
  if (!(input instanceof HTMLInputElement) || !(status instanceof HTMLSelectElement) || !rows.length) return;
  const update = () => {
    const query = input.value.trim().toLowerCase();
    const selectedStatus = status.value;
    let visible = 0;
    rows.forEach((row) => {
      const matchesQuery = !query || (row.getAttribute("data-search") || "").includes(query);
      const matchesStatus = !selectedStatus || row.getAttribute("data-status") === selectedStatus;
      row.hidden = !(matchesQuery && matchesStatus);
      if (!row.hidden) visible += 1;
    });
    if (empty instanceof HTMLElement) empty.hidden = visible > 0;
  };
  input.addEventListener("input", update);
  status.addEventListener("change", update);
}

function initScrambleText() {
  if (reducedMotion) return;
  const alphabet = "0123456789ABCDEFGHJKLMNPRSTUVWXYZ/\\+-";
  const revealQueue = [];

  document.querySelectorAll("[data-scramble]").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    const original = element.textContent || "";
    if (!original.trim()) return;

    const copy = document.createElement("span");
    const noise = document.createElement("span");
    const shard = document.createElement("span");
    copy.className = "scramble-copy";
    noise.className = "scramble-noise";
    shard.className = "scramble-shard";
    copy.textContent = original;
    noise.setAttribute("aria-hidden", "true");
    shard.setAttribute("aria-hidden", "true");
    element.replaceChildren(copy, noise, shard);
    element.classList.add("scramble-ready");

    let animation = 0;
    let timeout = 0;
    let hoverLocked = false;
    let hoverRelease = 0;

    const run = (duration = 420) => {
      if (element.classList.contains("is-scrambling")) return;
      window.cancelAnimationFrame(animation);
      window.clearTimeout(timeout);
      const started = performance.now();
      element.classList.add("is-scrambling");

      const draw = (time) => {
        const progress = Math.min(1, (time - started) / duration);
        const resolved = Math.floor((1 - Math.pow(1 - progress, 3)) * original.length);
        const disrupted = [...original].map((character, index) => {
          if (/\s/.test(character) || index < resolved) return character;
          if (index > resolved + 5) return character;
          if (/[a-z]/.test(character)) return "abcdefghijkmnpqrstuvwxyz"[Math.floor(Math.random() * 24)];
          if (/[A-Z]/.test(character)) return "ABCDEFGHJKLMNPRSTUVWXYZ"[Math.floor(Math.random() * 23)];
          if (/\d/.test(character)) return "0123456789"[Math.floor(Math.random() * 10)];
          return alphabet[Math.floor(Math.random() * alphabet.length)];
        }).join("");
        noise.textContent = disrupted;
        shard.textContent = disrupted;

        if (progress < 1) {
          animation = window.requestAnimationFrame(draw);
          return;
        }

        noise.textContent = "";
        shard.textContent = "";
        element.classList.remove("is-scrambling");
      };

      animation = window.requestAnimationFrame(draw);
    };

    element.addEventListener("pointerenter", () => {
      if (hoverLocked) return;
      hoverLocked = true;
      run(340);
    });
    element.addEventListener("pointerleave", () => {
      window.clearTimeout(hoverRelease);
      hoverRelease = window.setTimeout(() => {
        if (!element.matches(":hover")) hoverLocked = false;
      }, 120);
    });
    element.addEventListener("focus", () => run(340));

    if (element.hasAttribute("data-scramble-start")) {
      const delay = Number(element.getAttribute("data-scramble-start"));
      timeout = window.setTimeout(() => run(560), Number.isFinite(delay) ? delay : 0);
    }

    if (element.hasAttribute("data-scramble-reveal")) revealQueue.push({ element, run });
  });

  if (!revealQueue.length) return;
  if (!("IntersectionObserver" in window)) {
    revealQueue.forEach(({ run }) => run(460));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const item = revealQueue.find(({ element }) => element === entry.target);
      item?.run(460);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10%", threshold: 0.35 });

  revealQueue.forEach(({ element }) => observer.observe(element));
}

function initCommandPalette() {
  const dialog = document.querySelector("[data-command-dialog]");
  const input = document.querySelector("[data-command-input]");
  const results = document.querySelector("[data-command-results]");
  if (!(dialog instanceof HTMLDialogElement) || !(input instanceof HTMLInputElement) || !(results instanceof HTMLElement)) return;
  let index = [];
  let selected = 0;
  let loading;
  const load = () => {
    loading ||= fetch("/search.json").then((response) => {
      if (!response.ok) throw new Error("Search index unavailable");
      return response.json();
    }).then((items) => {
      index = Array.isArray(items) ? items : [];
    }).catch(() => {
      index = [];
    });
    return loading;
  };
  const score = (item, query) => {
    const title = item.title.toLowerCase();
    const description = item.description.toLowerCase();
    const tags = item.tags.join(" ").toLowerCase();
    const text = item.text.toLowerCase();
    if (title === query) return 100;
    if (title.startsWith(query)) return 80;
    if (title.includes(query)) return 60;
    if (tags.includes(query)) return 40;
    if (description.includes(query)) return 30;
    if (text.includes(query)) return 10;
    return 0;
  };
  const render = () => {
    const query = input.value.trim().toLowerCase();
    const matches = query
      ? index.map((item) => ({ item, score: score(item, query) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title)).slice(0, 9).map((entry) => entry.item)
      : index.slice(0, 7);
    selected = Math.min(selected, Math.max(0, matches.length - 1));
    results.replaceChildren();
    if (!matches.length) {
      const message = document.createElement("p");
      message.textContent = query ? "No matching pages." : "Start typing to search every published page.";
      results.append(message);
      return;
    }
    matches.forEach((item, itemIndex) => {
      const link = document.createElement("a");
      link.className = "command-result";
      link.href = item.href;
      link.setAttribute("aria-selected", String(itemIndex === selected));
      const kind = document.createElement("span");
      kind.textContent = item.kind;
      const copy = document.createElement("span");
      const heading = document.createElement("strong");
      const description = document.createElement("p");
      heading.textContent = item.title;
      description.textContent = item.description;
      copy.append(heading, description);
      link.append(kind, copy);
      results.append(link);
    });
  };
  const open = async () => {
    if (!dialog.open) dialog.showModal();
    document.body.dataset.commandOpen = "true";
    input.value = "";
    selected = 0;
    await load();
    render();
    input.focus();
  };
  const close = () => {
    if (dialog.open) dialog.close();
    delete document.body.dataset.commandOpen;
  };
  document.querySelectorAll("[data-command-open]").forEach((button) => button.addEventListener("click", open));
  document.querySelectorAll("[data-command-close]").forEach((button) => button.addEventListener("click", close));
  dialog.addEventListener("close", () => delete document.body.dataset.commandOpen);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  input.addEventListener("input", () => {
    selected = 0;
    render();
  });
  input.addEventListener("keydown", (event) => {
    const links = [...results.querySelectorAll("a")];
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selected = Math.min(selected + 1, links.length - 1);
      render();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      selected = Math.max(0, selected - 1);
      render();
    }
    if (event.key === "Enter" && links[selected]) {
      event.preventDefault();
      links[selected].click();
    }
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
    if (event.key === "Escape" && dialog.open) {
      event.preventDefault();
      close();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      open();
    }
    if (event.key === "/" && !typing && !dialog.open) {
      event.preventDefault();
      open();
    }
  });
}


function initLocalClock() {
  const clock = document.querySelector("[data-location-clock]");
  const location = document.querySelector("[data-clock-location]");
  const time = document.querySelector("[data-clock-time]");
  const age = document.querySelector("[data-live-age]");
  const dialog = document.querySelector("[data-location-dialog]");
  const form = document.querySelector("[data-location-form]");
  const labelInput = document.querySelector("[data-location-label-input]");
  const zoneInput = document.querySelector("[data-location-zone-input]");
  const error = document.querySelector("[data-location-error]");
  if (!(clock instanceof HTMLButtonElement) || !(location instanceof HTMLElement) || !(time instanceof HTMLTimeElement) || !(age instanceof HTMLElement)) return;

  const defaults = {
    label: clock.dataset.defaultLocation || "Dublin",
    zone: clock.dataset.defaultTimeZone || "Europe/Dublin"
  };
  const birth = new Date(`${clock.dataset.birthDate || "2009-02-20"}T00:00:00Z`);
  const readStored = () => {
    try {
      const value = JSON.parse(localStorage.getItem("basil-location") || "null");
      return value && typeof value.label === "string" && typeof value.zone === "string" ? value : defaults;
    } catch {
      return defaults;
    }
  };
  const validZone = (zone) => {
    try {
      new Intl.DateTimeFormat("en-IE", { timeZone: zone }).format();
      return true;
    } catch {
      return false;
    }
  };
  const exactAge = (now) => {
    let year = now.getUTCFullYear();
    const birthdayThisYear = new Date(Date.UTC(year, birth.getUTCMonth(), birth.getUTCDate()));
    const last = now < birthdayThisYear
      ? new Date(Date.UTC(year - 1, birth.getUTCMonth(), birth.getUTCDate()))
      : birthdayThisYear;
    const next = new Date(Date.UTC(last.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate()));
    return last.getUTCFullYear() - birth.getUTCFullYear() + (now - last) / (next - last);
  };
  let settings = readStored();

  const render = () => {
    const now = new Date();
    location.textContent = settings.label;
    time.textContent = new Intl.DateTimeFormat("en-IE", {
      timeZone: settings.zone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now);
    time.dateTime = now.toISOString();
    age.textContent = exactAge(now).toFixed(6);
    clock.setAttribute("aria-label", `${settings.label} time ${time.textContent}. Age ${age.textContent} years. Change displayed location and time zone.`);
  };

  const close = () => {
    if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
    delete document.body.dataset.locationOpen;
  };
  const open = () => {
    if (!(dialog instanceof HTMLDialogElement) || !(labelInput instanceof HTMLInputElement) || !(zoneInput instanceof HTMLInputElement)) return;
    labelInput.value = settings.label;
    zoneInput.value = settings.zone;
    if (error instanceof HTMLElement) error.textContent = "";
    document.body.dataset.locationOpen = "true";
    dialog.showModal();
    labelInput.focus();
    labelInput.select();
  };

  clock.addEventListener("click", open);
  document.querySelectorAll("[data-location-close]").forEach((button) => button.addEventListener("click", close));
  document.querySelectorAll("[data-location-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!(labelInput instanceof HTMLInputElement) || !(zoneInput instanceof HTMLInputElement)) return;
      labelInput.value = button.getAttribute("data-location-label") || "";
      zoneInput.value = button.getAttribute("data-location-zone") || "";
      if (error instanceof HTMLElement) error.textContent = "";
    });
  });
  document.querySelectorAll("[data-location-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      settings = defaults;
      try {
        localStorage.removeItem("basil-location");
      } catch {
        render();
      }
      render();
      close();
    });
  });
  if (form instanceof HTMLFormElement) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!(labelInput instanceof HTMLInputElement) || !(zoneInput instanceof HTMLInputElement)) return;
      const label = labelInput.value.trim();
      const zone = zoneInput.value.trim();
      if (!label || !validZone(zone)) {
        if (error instanceof HTMLElement) error.textContent = "Enter a place name and a valid IANA time zone such as Europe/Dublin.";
        return;
      }
      settings = { label, zone };
      try {
        localStorage.setItem("basil-location", JSON.stringify(settings));
      } catch {
        settings = { label, zone };
      }
      render();
      close();
    });
  }
  if (dialog instanceof HTMLDialogElement) {
    dialog.addEventListener("close", () => delete document.body.dataset.locationOpen);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog instanceof HTMLDialogElement && dialog.open) close();
  });
  render();
  window.setInterval(render, 1000);
}

initThemeToggle();
initReveal();
initCopyButtons();
initProjectFilter();
initScrambleText();
initCommandPalette();
initLocalClock();
