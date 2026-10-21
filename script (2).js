(function () {
  "use strict";

  const form = document.getElementById("hdi-form");
  const btn = document.getElementById("predict-btn");
  const formError = document.getElementById("form-error");
  const gaugeArc = document.getElementById("gauge-arc");
  const gaugeScore = document.getElementById("gauge-score");
  const gaugeTier = document.getElementById("gauge-tier");
  const resultNote = document.getElementById("result-note");
  const tierSwatches = document.querySelectorAll(".tier-swatch");

  const TIER_COLORS = {
    low: "#E2665A",
    medium: "#E8A94A",
    high: "#6FCF97",
    "very-high": "#4FD1C5",
  };

  const arcLength = gaugeArc.getTotalLength();
  gaugeArc.style.strokeDasharray = `0 ${arcLength}`;

  function setGauge(score, tierLabel, tierClass) {
    const clamped = Math.max(0, Math.min(1, score));
    const filled = clamped * arcLength;
    gaugeArc.style.stroke = TIER_COLORS[tierClass] || TIER_COLORS.medium;
    gaugeArc.style.strokeDasharray = `${filled} ${arcLength}`;
    gaugeScore.textContent = score.toFixed(3);
    gaugeTier.textContent = tierLabel;

    tierSwatches.forEach((el) => {
      el.classList.toggle("active", el.classList.contains(tierClass));
    });
  }

  function resetGauge() {
    gaugeArc.style.stroke = "#E8A94A";
    gaugeArc.style.strokeDasharray = `0 ${arcLength}`;
    gaugeScore.textContent = "—";
    gaugeTier.textContent = "Awaiting input";
    tierSwatches.forEach((el) => el.classList.remove("active"));
  }

  function setLoading(isLoading) {
    btn.classList.toggle("loading", isLoading);
    btn.disabled = isLoading;
  }

  function showError(message) {
    formError.textContent = message;
    resultNote.textContent = "Correct the highlighted field and try again.";
  }

  function clearError() {
    formError.textContent = "";
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearError();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = {
      life: form.life.value,
      expected: form.expected.value,
      mean: form.mean.value,
      income: form.income.value,
    };

    setLoading(true);

    try {
      const response = await fetch("/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Something went wrong. Please try again.");
        resetGauge();
        return;
      }

      setGauge(data.score, data.tier_label, data.tier_class);
      resultNote.innerHTML =
        `Predicted HDI of <strong>${data.score.toFixed(3)}</strong> places this profile in the ` +
        `<strong>${data.tier_label}</strong> human development tier.`;
    } catch (err) {
      showError("Could not reach the prediction service. Please try again.");
      resetGauge();
    } finally {
      setLoading(false);
    }
  });

  // Live-clear the error state as soon as the person edits a field again
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", clearError);
  });
})();
