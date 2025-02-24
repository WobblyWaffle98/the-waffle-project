import { createSignal, createMemo } from "solid-js";

export default function OptionTrading() {
  // Initialize signals with default values
  const [underlying, setUnderlying] = createSignal(100);
  const [strike, setStrike] = createSignal(100);
  const [premium, setPremium] = createSignal(10);
  const [optionType, setOptionType] = createSignal("call"); // "call" or "put"

  // Calculate payoff using a memo so it updates automatically when inputs change.
  const payoff = createMemo(() => {
    const u = parseFloat(underlying());
    const s = parseFloat(strike());
    const p = parseFloat(premium());
    // For a call option: max(u - s, 0) - premium
    // For a put option:  max(s - u, 0) - premium
    if (optionType() === "call") {
      return Math.max(u - s, 0) - p;
    } else {
      return Math.max(s - u, 0) - p;
    }
  });

  return (
    <section class="bg-slate-200 text-slate-700 p-8 rounded-md">
      <h2 class="text-2xl mb-4">Option Trading Simulator</h2>
      <p class="mb-4">Calculate the payoff of an option trading strategy by adjusting the parameters below:</p>

      <div class="mb-4">
        <label class="block mb-1">Underlying Price:</label>
        <input
          type="number"
          class="border rounded p-1"
          value={underlying()}
          onInput={(e) => setUnderlying(e.currentTarget.value)}
        />
      </div>

      <div class="mb-4">
        <label class="block mb-1">Strike Price:</label>
        <input
          type="number"
          class="border rounded p-1"
          value={strike()}
          onInput={(e) => setStrike(e.currentTarget.value)}
        />
      </div>

      <div class="mb-4">
        <label class="block mb-1">Premium:</label>
        <input
          type="number"
          class="border rounded p-1"
          value={premium()}
          onInput={(e) => setPremium(e.currentTarget.value)}
        />
      </div>

      <div class="mb-4">
        <span class="block mb-1">Option Type:</span>
        <label class="mr-2">
          <input
            type="radio"
            name="optionType"
            value="call"
            checked={optionType() === "call"}
            onInput={() => setOptionType("call")}
          />
          Call
        </label>
        <label>
          <input
            type="radio"
            name="optionType"
            value="put"
            checked={optionType() === "put"}
            onInput={() => setOptionType("put")}
          />
          Put
        </label>
      </div>

      <div class="mt-4 p-4 bg-white rounded shadow">
        <strong>Calculated Payoff:</strong> {payoff()}
      </div>
    </section>
  );
}
