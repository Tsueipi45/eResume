const focusProfiles = {
  production: {
    title: "把技术执行力带到内容与现场制作链路",
    body:
      "具备节目策划、排练协调、场馆沟通、设备调试、音效制作、现场场务与视频后期经验，能在多角色、多节点环境中推进内容落地。",
    points: [
      "负责《雷达海盗》音效制作及程序开发，作品获 GameJam 沈阳站最佳人气奖。",
      "自主举办两届“燃动次元”，覆盖演员、后勤场务及观众 400+ 人。",
      "具备现场调音、录音混音、视频剪辑、节目调度及多方协作经验。"
    ]
  },
  tech: {
    title: "用工程、AI 与内容理解打磨游戏体验",
    body:
      "具备 Python、C++、Java 工程实践，覆盖游戏开发、机器人、NLP 微调与 Agent 工作流，并拥有校队、社团及 ACG 内容场景经验。",
    points: [
      "负责《雷达海盗》程序开发与音效制作，首次参加 GameJam 即获沈阳站最佳人气奖。",
      "独立设计 Discord / QQ 机器人，覆盖异步架构、权限、日志与 API 整合。",
      "使用 Codex、Claude Code 与自制 Skill 辅助需求拆解、开发调试和可复用流程搭建。"
    ]
  },
  finance: {
    title: "把金融业务问题转化为可追溯的数据与分析流程",
    body:
      "拥有银行业务开发部与交易所结算部实习经历，覆盖公开财报分析、客户经理业务辅助、保证金业务研究与行情系统开发。",
    points: [
      "利用 Agent 与自制 Skill 提取五家银行公开财报指标，实现可溯源落表、历史分析与同业对比。",
      "围绕结算会员类别、保证金账户设置、保证金业务流程与有价证券作为保证金业务进行研究。",
      "参与 CTP API + C++ 行情预警系统开发，负责行情数据获取与服务器结构实现。"
    ]
  }
};

const card = document.querySelector("#focus-card");
const tabs = document.querySelectorAll(".focus-tab");
let focusSwitchTimer = 0;

function renderFocus(key) {
  const profile = focusProfiles[key];
  if (!profile || !card) return;

  card.innerHTML = `
    <h3>${profile.title}</h3>
    <p>${profile.body}</p>
    <ul>${profile.points.map((point) => `<li>${point}</li>`).join("")}</ul>
  `;
}

function switchFocus(key) {
  if (!card) return;

  window.clearTimeout(focusSwitchTimer);
  card.classList.remove("is-entering");
  card.classList.add("is-switching");

  focusSwitchTimer = window.setTimeout(() => {
    renderFocus(key);
    card.classList.remove("is-switching");
    card.classList.add("is-entering");

    window.setTimeout(() => {
      card.classList.remove("is-entering");
    }, 280);
  }, 150);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("is-active")) return;

    tabs.forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-selected", "false");
    });

    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    switchFocus(tab.dataset.focus);
  });
});

const projectStrip = document.querySelector("#project-strip");
const projectTrack = document.querySelector("#project-track");
const projectScrollButtons = document.querySelectorAll("[data-scroll-projects]");
let projectAutoScrollId = 0;
let projectAutoScrollPausedUntil = 0;
let projectAutoScrollPosition = 0;
let projectAutoScrollLastTime = 0;
let projectLoopWidth = 0;
let projectUserOffset = 0;
let projectBoostAnimation = null;

function pauseProjectAutoScroll(duration = 5000) {
  projectAutoScrollPausedUntil = Date.now() + duration;
}

function measureProjectLoop() {
  if (!projectTrack) return;
  const cards = [...projectTrack.querySelectorAll(".project-card:not([data-clone])")];
  const lastCard = cards.at(-1);

  if (!cards.length || !lastCard) {
    projectLoopWidth = 0;
    return;
  }

  const trackLeft = projectTrack.getBoundingClientRect().left;
  const lastRight = lastCard.getBoundingClientRect().right;
  const gap = Number.parseFloat(getComputedStyle(projectTrack).columnGap || "0");
  projectLoopWidth = lastRight - trackLeft + gap;
}

function renderProjectTrack() {
  if (!projectTrack || !projectLoopWidth) return;
  const offset = -((projectAutoScrollPosition + projectUserOffset) % projectLoopWidth);
  projectTrack.style.transform = `translate3d(${offset}px, 0, 0)`;
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function startProjectBoost(direction) {
  if (!projectStrip || !projectLoopWidth) return;

  const distance = Math.min(Math.max(projectStrip.clientWidth * 0.32, 180), 300);
  projectBoostAnimation = {
    startTime: performance.now(),
    duration: 420,
    from: projectUserOffset,
    delta: direction * distance
  };
  pauseProjectAutoScroll(520);
}

projectScrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!projectStrip || !projectLoopWidth) return;

    const direction = Number(button.dataset.scrollProjects);
    button.classList.remove("is-boosting");
    void button.offsetWidth;
    button.classList.add("is-boosting");
    startProjectBoost(direction);
  });
});

function startProjectAutoScroll() {
  if (!projectStrip || !projectTrack || projectAutoScrollId) return;

  const originals = [...projectTrack.children];
  originals.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.dataset.clone = "true";
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    projectTrack.appendChild(clone);
  });

  measureProjectLoop();
  projectAutoScrollPosition = 0;
  projectUserOffset = 0;
  projectAutoScrollLastTime = performance.now();

  const step = (time) => {
    const elapsed = Math.min(time - projectAutoScrollLastTime, 80);
    projectAutoScrollLastTime = time;

    if (projectBoostAnimation) {
      const progress = Math.min((time - projectBoostAnimation.startTime) / projectBoostAnimation.duration, 1);
      projectUserOffset =
        (projectBoostAnimation.from + projectBoostAnimation.delta * easeOutCubic(progress) + projectLoopWidth) %
        projectLoopWidth;
      renderProjectTrack();

      if (progress >= 1) {
        projectBoostAnimation = null;
        projectAutoScrollLastTime = time;
      }
    } else if (Date.now() >= projectAutoScrollPausedUntil) {
      if (projectLoopWidth > 0) {
        projectAutoScrollPosition = (projectAutoScrollPosition + elapsed * 0.055) % projectLoopWidth;
        renderProjectTrack();
      }
    }

    projectAutoScrollId = requestAnimationFrame(step);
  };

  projectAutoScrollId = requestAnimationFrame(step);
}

if (projectStrip) {
  projectStrip.addEventListener("mouseenter", () => pauseProjectAutoScroll(900));
  projectStrip.addEventListener("focusin", () => pauseProjectAutoScroll(2500));
  projectStrip.addEventListener("touchstart", () => pauseProjectAutoScroll(3000), { passive: true });
  window.addEventListener("resize", () => {
    measureProjectLoop();
    renderProjectTrack();
  });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    startProjectAutoScroll();
  }
}
