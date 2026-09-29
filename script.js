(function () {
  "use strict";

  var cfg = window.CONFIG;
  var maxBytes = cfg.SAIZ_RESIT_MAKS_MB * 1024 * 1024;
  var BULAN = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai",
    "Ogos", "September", "Oktober", "November", "Disember"];

  var $ = function (id) { return document.getElementById(id); };
  var show = function (id, on) { $(id).classList.toggle("hidden", !on); };
  var form = $("form");
  var submitBtn = $("submitBtn");
  var formMsg = $("formMsg");
  var fileInput = $("resit");
  var drop = $("drop");

  var senarai = [];   // semua lencana aktif dari Google Sheet
  var lencana = null; // lencana yang sedang ditempah
  var timer = null;

  // ---------- Utiliti ----------
  function rm(n) { return "RM " + Number(n).toFixed(2); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // Format tarikh dalam waktu Malaysia, cth. "2 Oktober 2026, 11:00 malam".
  function formatTarikh(iso) {
    var p = {};
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(iso)).forEach(function (x) { p[x.type] = x.value; });
    var h = Number(p.hour);
    var waktu = h < 12 ? "pagi" : h < 14 ? "tengah hari" : h < 19 ? "petang" : "malam";
    return Number(p.day) + " " + BULAN[Number(p.month) - 1] + " " + p.year + ", " +
      (h % 12 || 12) + ":" + p.minute + " " + waktu;
  }

  function isClosed() { return !lencana || Date.now() > new Date(lencana.tarikhAkhir).getTime(); }

  // ---------- Maklumat bank ----------
  $("bankNama").textContent = cfg.BANK.nama;
  $("bankNo").textContent = cfg.BANK.noAkaun;
  $("bankBank").textContent = cfg.BANK.bank;
  var dropSubDefault = "Gambar (JPG/PNG) atau PDF, maksimum " + cfg.SAIZ_RESIT_MAKS_MB + " MB";
  $("dropSub").textContent = dropSubDefault;

  $("copyBtn").addEventListener("click", function () {
    var btn = this;
    var done = function () {
      btn.textContent = "Disalin!";
      setTimeout(function () { btn.textContent = "Salin"; }, 1500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cfg.BANK.noAkaun).then(done, fallbackCopy);
    } else {
      fallbackCopy();
    }
    function fallbackCopy() {
      var t = document.createElement("textarea");
      t.value = cfg.BANK.noAkaun;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy"); done(); } catch (e) { /* abaikan */ }
      document.body.removeChild(t);
    }
  });

  // ---------- Muat senarai lencana ----------
  function load() {
    show("loading", true);
    show("loadError", false);
    if (!cfg.SCRIPT_URL) {
      loadFailed("Borang belum disambungkan ke sistem (SCRIPT_URL kosong dalam config.js).");
      return;
    }
    fetch(cfg.SCRIPT_URL)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error);
        senarai = data.lencana || [];
        show("loading", false);
        route();
      })
      .catch(function (err) {
        loadFailed(err && err.message && err.message !== "Failed to fetch" ? err.message : null);
      });
  }

  function loadFailed(msg) {
    show("loading", false);
    show("loadError", true);
    $("loadErrorMsg").textContent = msg || "Sila semak sambungan internet dan muat semula halaman.";
  }

  $("retryBtn").addEventListener("click", load);

  // Pilih paparan berdasarkan ?lencana=ID dalam URL, atau terus buka jika hanya satu dibuka.
  function route() {
    var id = new URLSearchParams(location.search).get("lencana");
    var dipilih = senarai.filter(function (l) { return l.id === id; })[0];
    var dibuka = senarai.filter(function (l) { return l.dibuka; });

    if (dipilih) return select(dipilih, false);
    if (dibuka.length === 1 && senarai.length === 1) return select(dibuka[0], false);
    if (!senarai.length) { show("empty", true); return; }
    showChooser();
  }

  window.addEventListener("popstate", function () {
    if (!senarai.length) return;
    resetForm();
    route();
  });

  // ---------- Senarai pilihan lencana ----------
  function showChooser() {
    lencana = null;
    clearTimeout(timer);
    ["badgeHead", "deadline", "closed", "form", "success"].forEach(function (id) { show(id, false); });

    var list = $("badgeList");
    list.innerHTML = "";
    senarai
      .slice()
      .sort(function (a, b) { return (b.dibuka - a.dibuka) || a.tarikhAkhir.localeCompare(b.tarikhAkhir); })
      .forEach(function (l) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "badge-card" + (l.dibuka ? "" : " is-closed");

        var img = document.createElement("img");
        img.src = l.gambar || "assets/lencana.jpg";
        img.alt = "";
        img.loading = "lazy";

        var info = document.createElement("span");
        info.className = "badge-card-info";
        var nama = document.createElement("strong");
        nama.textContent = l.nama;
        var desc = document.createElement("span");
        desc.className = "badge-card-desc";
        desc.textContent = l.keterangan;
        var meta = document.createElement("span");
        meta.className = "badge-card-meta";
        meta.textContent = rm(l.harga) + " seunit · " +
          (l.dibuka ? "Tutup " + formatTarikh(l.tarikhAkhir) : "Ditutup");

        info.appendChild(nama);
        if (l.keterangan) info.appendChild(desc);
        info.appendChild(meta);
        btn.appendChild(img);
        btn.appendChild(info);
        btn.addEventListener("click", function () { select(l, true); });
        list.appendChild(btn);
      });

    show("chooser", true);
  }

  $("changeBtn").addEventListener("click", function () {
    resetForm();
    history.pushState(null, "", location.pathname);
    showChooser();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---------- Lencana dipilih ----------
  function select(l, push) {
    lencana = l;
    if (push) history.pushState(null, "", "?lencana=" + encodeURIComponent(l.id));

    show("chooser", false);
    show("empty", false);
    show("success", false);

    $("badgeImg").src = l.gambar || "assets/lencana.jpg";
    $("badgeImg").alt = "Lencana " + l.nama;
    $("badgeName").textContent = l.nama;
    $("badgeDesc").textContent = l.keterangan;
    $("badgePrice").textContent = rm(l.harga);
    $("deadlineText").textContent = formatTarikh(l.tarikhAkhir);
    document.title = "Tempahan Lencana · " + l.nama;
    show("badgeHead", true);
    show("changeBtn", senarai.length > 1);
    show("deadline", true);

    updateTotal();
    clearTimeout(timer);
    tick();
    if (!isClosed()) {
      show("closed", false);
      show("form", true);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Kiraan detik ----------
  function tick() {
    var diff = new Date(lencana.tarikhAkhir).getTime() - Date.now();
    if (diff <= 0) {
      $("countdown").textContent = "Ditutup";
      showClosed();
      return;
    }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor(diff / 3600000) % 24;
    var m = Math.floor(diff / 60000) % 60;
    var s = Math.floor(diff / 1000) % 60;
    $("countdown").textContent =
      "Baki " + (d ? d + " hari " : "") + pad(h) + ":" + pad(m) + ":" + pad(s);
    timer = setTimeout(tick, 1000);
  }

  function showClosed() {
    // Jangan sembunyikan halaman kejayaan jika tempahan baru sahaja dihantar.
    if (!$("success").classList.contains("hidden")) return;
    show("form", false);
    show("closed", true);
  }

  // ---------- Jumlah bayaran ----------
  function updateTotal() {
    if (!lencana) return;
    var n = parseInt($("bilangan").value, 10);
    n = n > 0 ? n : 0;
    $("totalCalc").textContent = n ? "(" + n + " × " + rm(lencana.harga) + ")" : "";
    $("totalAmount").textContent = rm(n * lencana.harga);
    $("payAmount").textContent = n ? rm(n * lencana.harga) : "jumlah di atas";
  }
  $("bilangan").addEventListener("input", updateTotal);

  // ---------- Fail resit ----------
  fileInput.addEventListener("change", function () {
    var f = fileInput.files[0];
    if (f) {
      $("dropTitle").textContent = f.name;
      $("dropSub").textContent = (f.size / 1024 / 1024).toFixed(2) + " MB · tekan untuk tukar fail";
      drop.classList.add("has-file");
    }
    validate("resit");
  });

  // ---------- Pengesahan ----------
  function normalisePhone(v) {
    var d = v.replace(/[^\d+]/g, "");
    if (d.indexOf("+60") === 0) d = "0" + d.slice(3);
    else if (d.indexOf("60") === 0 && d.length >= 11) d = "0" + d.slice(2);
    return d.replace(/\+/g, "");
  }

  var rules = {
    sekolah: function (v) { return v.trim().length >= 3 ? "" : "Sila masukkan nama sekolah."; },
    pemimpin: function (v) { return v.trim().length >= 3 ? "" : "Sila masukkan nama pemimpin."; },
    telefon: function (v) {
      return /^01\d{8,9}$/.test(normalisePhone(v)) ? "" : "No. telefon tidak sah. Contoh: 012-3456789";
    },
    bilangan: function (v) {
      var n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 1000 ? "" : "Sila masukkan bilangan (1 hingga 1000).";
    },
    resit: function () {
      var f = fileInput.files[0];
      if (!f) return "Sila muat naik resit bayaran.";
      if (!/^image\/|^application\/pdf$/.test(f.type)) return "Fail mesti gambar (JPG/PNG) atau PDF.";
      if (f.size > maxBytes) return "Saiz fail melebihi " + cfg.SAIZ_RESIT_MAKS_MB + " MB.";
      return "";
    },
    sahkan: function () { return $("sahkan").checked ? "" : "Sila tandakan pengesahan."; },
  };

  function validate(name) {
    var el = $(name);
    var msg = rules[name](el.value || "");
    var errEl = form.querySelector('.err[data-for="' + name + '"]');
    errEl.textContent = msg;
    (name === "resit" ? drop : el).classList.toggle("invalid", !!msg);
    return !msg;
  }

  ["sekolah", "pemimpin", "telefon", "bilangan"].forEach(function (name) {
    $(name).addEventListener("blur", function () { validate(name); });
  });
  $("sahkan").addEventListener("change", function () { validate("sahkan"); });

  // ---------- Hantar ----------
  function readAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1]); };
      r.onerror = function () { reject(new Error("Gagal membaca fail resit.")); };
      r.readAsDataURL(file);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    formMsg.textContent = "";

    if (isClosed()) { showClosed(); return; }

    var ok = Object.keys(rules).map(validate).every(Boolean);
    if (!ok) {
      var first = form.querySelector(".err:not(:empty)");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Menghantar…";

    var file = fileInput.files[0];
    readAsBase64(file)
      .then(function (b64) {
        var payload = {
          lencanaId: lencana.id,
          sekolah: $("sekolah").value.trim(),
          pemimpin: $("pemimpin").value.trim(),
          telefon: normalisePhone($("telefon").value),
          bilangan: parseInt($("bilangan").value, 10),
          resit: { nama: file.name, jenis: file.type, data: b64 },
        };
        // text/plain mengelakkan CORS preflight yang tidak disokong oleh Apps Script.
        return fetch(cfg.SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || "Tempahan gagal dihantar.");
        showSuccess(data);
      })
      .catch(function (err) {
        formMsg.textContent = err && err.message && err.message !== "Failed to fetch"
          ? err.message
          : "Tempahan gagal dihantar. Sila semak sambungan internet dan cuba lagi.";
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Hantar tempahan";
      });
  });

  function showSuccess(data) {
    var rows = [
      ["No. rujukan", data.id, "ref"],
      ["Lencana", data.lencana],
      ["Sekolah", data.sekolah],
      ["Pemimpin", data.pemimpin],
      ["No. telefon", data.telefon],
      ["Bilangan", data.bilangan],
      ["Jumlah", rm(data.jumlah)],
    ];

    var dl = $("summary");
    dl.innerHTML = "";
    rows.forEach(function (r) {
      var div = document.createElement("div");
      if (r[2]) div.className = r[2];
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = r[0];
      dd.textContent = r[1];
      div.appendChild(dt);
      div.appendChild(dd);
      dl.appendChild(div);
    });

    show("form", false);
    show("success", true);
    window.scrollTo({ top: $("success").offsetTop - 16, behavior: "smooth" });
  }

  function resetForm() {
    form.reset();
    formMsg.textContent = "";
    form.querySelectorAll(".err").forEach(function (el) { el.textContent = ""; });
    form.querySelectorAll(".invalid").forEach(function (el) { el.classList.remove("invalid"); });
    $("dropTitle").textContent = "Pilih fail resit";
    $("dropSub").textContent = dropSubDefault;
    drop.classList.remove("has-file");
    updateTotal();
  }

  $("againBtn").addEventListener("click", function () {
    resetForm();
    show("success", false);
    if (isClosed()) { showClosed(); return; }
    show("form", true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  load();
})();
