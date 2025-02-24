import { createSignal, onMount, For } from "solid-js";

export default function Home() {
  const [mandates, setMandates] = createSignal([]);

  // Fetch mandates from the back end
  const fetchMandates = async () => {
    try {
      const res = await fetch("http://localhost:5000/mandates");
      const data = await res.json();
      setMandates(data);
    } catch (error) {
      console.error("Error fetching mandates:", error);
    }
  };

  // Lock a given position for trader "trader1"
  const lockPosition = async (mandateId: string, positionId: number) => {
    try {
      await fetch("http://localhost:5000/lockPosition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mandateId, positionId, traderId: "trader1" }),
      });
      // Refresh mandates after locking a position
      fetchMandates();
    } catch (error) {
      console.error("Error locking position:", error);
    }
  };

  onMount(() => {
    fetchMandates();
  });

  return (
    <section class="p-8">
      <h2 class="text-2xl mb-4">Crude Oil Options Mandates</h2>
      <For each={mandates()}>
        {(mandate) => (
          <div class="bg-slate-200 text-slate-700 p-4 rounded mb-4">
            <h3 class="text-xl mb-2">
              Mandate ID: {mandate.id.substring(0, 8)}
            </h3>
            <p>
              Put Strike: {mandate.putStrike}, Lower Put Strike:{" "}
              {mandate.lowerPutStrike}, Max Cost: USD {mandate.maxCost}/barrel
            </p>
            <div class="mt-4">
              <h4 class="font-semibold mb-2">Positions:</h4>
              <For each={mandate.positions}>
                {(position) => (
                  <div class="flex items-center justify-between my-2">
                    <span>
                      Position {position.id} - Status: {position.status}{" "}
                      {position.lockedBy &&
                        `(Locked by ${position.lockedBy})`}
                    </span>
                    {position.status === "open" && (
                      <button
                        type="button"
                        class="bg-blue-500 text-white px-3 py-1 rounded"
                        onClick={() =>
                          lockPosition(mandate.id, position.id)
                        }
                      >
                        Lock
                      </button>
                    )}
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </For>
    </section>
  );
}
