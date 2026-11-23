/* The Premiere demos. Each plays by itself while on screen, then again; with reduced motion each shows its
   finished result, still.
   The home page's two cards share one template: the tool's panel, a press, the bar for a moment, then its
   Timeline with the clips moving. Pullquote's own page has the whole corner of Premiere: the empty box, the script
   pasted, a press of Find Soundbites, the passages found, a press of Build Sequence, the bar while it builds, the finished screen. */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // steps: [[ms, function], ...] from the start of a cycle; the last one's time is the cycle's length.
  function player(demo, play, first, last, stage, steps) {
    if (!demo) return;
    var timers = [], paused = false, visible = false, running = false;
    function later(ms, f) { timers.push(setTimeout(f, ms)); }
    function cycle() {
      running = true;
      demo.classList.add("instant"); demo.classList.remove("press"); demo.classList.remove("finding"); stage(first); void demo.offsetWidth; demo.classList.remove("instant");
      steps.forEach(function (s, i) {
        later(s[0], i < steps.length - 1 ? s[1] : function () { if (!paused && visible) cycle(); else running = false; });
      });
    }
    if (reduce) { stage(last); return; }
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !paused && !running) cycle();
    }, { threshold: 0.35 }).observe(demo);
    if (play) play.addEventListener("click", function () {
      paused = !paused;
      play.textContent = paused ? "Play" : "Pause";
      if (paused) { timers.forEach(clearTimeout); timers = []; running = false; }
      else if (visible) cycle();
    });
  }
  // A stage setter for a demo: the stage itself, and any timecode that differs once the result shows (data-a, data-b).
  function stager(demo, last) {
    var both = demo.querySelectorAll("[data-a]");
    return function (s) {
      demo.setAttribute("data-stage", s);
      [].forEach.call(both, function (t) { t.textContent = t.getAttribute(s === last ? "data-b" : "data-a"); });
    };
  }

  // Syncpoint's card
  (function () {
    var demo = document.getElementById("spMini");
    if (!demo) return;
    var stage = stager(demo, "done");
    // The panel is only the way in: Sync is pressed almost at once. The Timeline then rests on the before for a beat,
    // moves, and rests longer on the after (Michael, 2026-11-21).
    player(demo, null, "before", "done", stage, [
      [800, function () { demo.classList.add("press"); }],
      [1100, function () { demo.classList.remove("press"); stage("running"); }],
      [2200, function () { stage("shown"); }],
      [3500, function () { stage("done"); }],
      [9800]
    ]);
  })();

  // Pullquote's card, and the whole demo on its own page: the same stages, the card a little quicker.
  // beat: on a card, how long the Timeline rests on the before ("shown") ahead of the after; 0 on the full demo,
  // where the Timeline is in view the whole time.
  function pullquote(id, play, t, beat) {
    var demo = document.getElementById(id);
    if (!demo) return;
    var stage = stager(demo, "built");
    var steps = [
      [t[0], function () { stage("pasted"); }],
      [t[1] - 300, function () { demo.classList.add("finding"); }],                      // Find Soundbites is pressed: a paste waits for it
      [t[1], function () { demo.classList.remove("finding"); stage("matched"); }],
      [t[2], function () { demo.classList.add("press"); }],
      [t[2] + 300, function () { demo.classList.remove("press"); stage("building"); }]
    ];
    if (beat) steps.push([t[2] + 1500, function () { stage("shown"); }]);
    steps.push([t[2] + 1500 + (beat || 0), function () { stage("built"); }], [t[3]]);
    player(demo, play, "empty", "built", stage, steps);
  }
  pullquote("pqMini", null, [900, 2100, 3500, 11600], 1300);
  pullquote("pqDemo", document.getElementById("pqPlay"), [1800, 3300, 6300, 14200], 0);

  // The cards' light follows the pointer; sections rise in as they are reached.
  [].forEach.call(document.querySelectorAll(".card"), function (c) {
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
  if ("IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); } });
    }, { threshold: 0.15 });
    [].forEach.call(document.querySelectorAll(".reveal"), function (el) { seen.observe(el); });
  } else [].forEach.call(document.querySelectorAll(".reveal"), function (el) { el.classList.add("in"); });
})();
