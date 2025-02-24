import { createSignal, For } from "solid-js";

interface Position {
  id: number;
  symbol: string;
  optionType: 'call' | 'put';
  quantity: number;
  strike: number;
  underlyingPrice: number;
  delta: number;
  premium: number;
}

export default function OptionHedgingBlotter() {
  // Sample positions data for the blotter
  const [positions] = createSignal<Position[]>([
    { id: 1, symbol: "AAPL", optionType: "call", quantity: 10, strike: 150, underlyingPrice: 155, delta: 0.6, premium: 5 },
    { id: 2, symbol: "GOOGL", optionType: "put", quantity: 5, strike: 2700, underlyingPrice: 2650, delta: -0.4, premium: 30 },
    { id: 3, symbol: "TSLA", optionType: "call", quantity: 7, strike: 700, underlyingPrice: 710, delta: 0.7, premium: 20 },
  ]);

  // Calculate the hedge position: (quantity * delta)
  const calculateHedge = (position: Position) => position.quantity * position.delta;

  return (
    <section class="bg-slate-200 text-slate-700 p-8 rounded-md">
      <h2 class="text-2xl mb-4">Option Hedging Blotter</h2>
      <p class="mb-6">Review your option positions and their corresponding hedge metrics below.</p>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th class="px-4 py-2 border-b">Symbol</th>
              <th class="px-4 py-2 border-b">Option Type</th>
              <th class="px-4 py-2 border-b">Quantity</th>
              <th class="px-4 py-2 border-b">Strike</th>
              <th class="px-4 py-2 border-b">Underlying Price</th>
              <th class="px-4 py-2 border-b">Delta</th>
              <th class="px-4 py-2 border-b">Hedge Position</th>
              <th class="px-4 py-2 border-b">Premium</th>
            </tr>
          </thead>
          <tbody>
            <For each={positions()}>
              {(position) => (
                <tr class="hover:bg-slate-100">
                  <td class="px-4 py-2 border-b">{position.symbol}</td>
                  <td class="px-4 py-2 border-b capitalize">{position.optionType}</td>
                  <td class="px-4 py-2 border-b">{position.quantity}</td>
                  <td class="px-4 py-2 border-b">{position.strike}</td>
                  <td class="px-4 py-2 border-b">{position.underlyingPrice}</td>
                  <td class="px-4 py-2 border-b">{position.delta}</td>
                  <td class="px-4 py-2 border-b">{calculateHedge(position)}</td>
                  <td class="px-4 py-2 border-b">{position.premium}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </section>
  );
}
