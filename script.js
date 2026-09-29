(function () {
  "use strict";

  var cfg = window.CONFIG;
  var deadline = new Date(cfg.TARIKH_AKHIR).getTime();
  var maxBytes = cfg.SAIZ_RESIT_MAKS_MB * 1024 * 1024;

  var $ = function (id) { return document.getElementById(id); };
  var form = $("form");
  var submitBtn = $("submitBtn");
  var formMsg = $("formMsg");
  var fileInput = $("resit");
  var drop = $("drop");

  // ---------- Maklumat bank ----------
  $("bankNama").textContent = cfg.BANK.nama;
  $("bankNo").textContent = cfg.BANK.noAkaun;
  $("bankBank").textContent = cfg.BANK.bank;
  $("dropSub").textContent = "Gambar (JPG/PNG) atau PDF, maksimum " + cfg.SAIZ_RESIT_MAKS_MB + " MB";

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

  // ---------- Tarikh akhir & kiraan detik ----------
  function isClosed() { return Date.now() > deadline; }

  function tick() {
    var diff = deadline - Date.now();
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
    setTimeout(tick, 1000);
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function showClosed() {
    // Jangan sembunyikan halaman kejayaan jika tempahan baru sahaja dihantar.
    if (!$("success").classList.contains("hidden")) return;
    form.classList.add("hidden");
    $("closed").classList.remove("hidden");
  }

  tick();

  // ---------- Jumlah bayaran ----------
  function updateTotal() {
    if (!(cfg.HARGA_SEUNIT > 0)) return;
    var n = parseInt($("bilangan").value, 10);
    $("total").classList.remove("hidden");
    $("totalAmount").textContent = "RM " + ((n > 0 ? n : 0) * cfg.HARGA_SEUNIT).toFixed(2);
  }
  $("bilangan").addEventListener("input", updateTotal);
  updateTotal();

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

    if (!cfg.SCRIPT_URL) {
      formMsg.textContent = "Borang belum disambungkan ke sistem (SCRIPT_URL kosong dalam config.js).";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Menghantar…";

    var file = fileInput.files[0];
    readAsBase64(file)
      .then(function (b64) {
        var payload = {
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
      ["Sekolah", data.sekolah],
      ["Pemimpin", data.pemimpin],
      ["No. telefon", data.telefon],
      ["Bilangan", data.bilangan],
    ];
    if (cfg.HARGA_SEUNIT > 0) rows.push(["Jumlah", "RM " + (data.bilangan * cfg.HARGA_SEUNIT).toFixed(2)]);

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

    form.classList.add("hidden");
    $("success").classList.remove("hidden");
    window.scrollTo({ top: $("success").offsetTop - 16, behavior: "smooth" });
  }

  $("againBtn").addEventListener("click", function () {
    form.reset();
    $("dropTitle").textContent = "Pilih fail resit";
    $("dropSub").textContent = "Gambar (JPG/PNG) atau PDF, maksimum " + cfg.SAIZ_RESIT_MAKS_MB + " MB";
    drop.classList.remove("has-file");
    updateTotal();
    $("success").classList.add("hidden");
    if (isClosed()) { showClosed(); return; }
    form.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
