// --- Add Option Leg Functionality ---
document.getElementById("addLeg").addEventListener("click", function () {
    const legsContainer = document.getElementById("legsContainer");
    const legDiv = document.createElement("div");
    legDiv.classList.add("leg");
  
    // Added min="0" to strike price input to prevent negatives
    legDiv.innerHTML = `
      <div class="leg-field">
        <label>Strike Price</label>
        <input type="number" class="strike" required min="0">
      </div>
      <div class="leg-field">
        <label>Option Type</label>
        <select class="type">
          <option value="Put" selected>Put</option>
          <option value="Call">Call</option>
        </select>
      </div>
      <button type="button" class="remove-leg">Remove</button>
    `;
  
    legsContainer.appendChild(legDiv);
  
    legDiv.querySelector(".remove-leg").addEventListener("click", function () {
      legDiv.remove();
    });
  });
  
  // Global filled orders counter
  let filledCount = 0;
  
  // --- Custom Volume Formatting Function ---
  // Formats the volume using standard accounting format with commas (e.g., "1,000", "12,000")
  function formatVolume(volume) {
    return Number(volume).toLocaleString('en-US');
  }
  
  // --- Form Submission and Order Creation (Open Orders) ---
  document.getElementById("optionsForm").addEventListener("submit", function (event) {
    event.preventDefault();
  
    // Format contract month as MMM, YY
    const contractMonthInput = document.getElementById("contractMonth").value;
    const contractDate = new Date(contractMonthInput + "-01");
    const contractMonthFormatted = contractDate.toLocaleString("en-US", { month: "short", year: "2-digit" });
  
    // Get premium value (with 2 decimals)
    const maxPremium = parseFloat(document.getElementById("maxPremium").value).toFixed(2);
    if (isNaN(maxPremium)) {
      alert("Please enter a valid premium value.");
      return;
    }
  
    // Validate Number of Clips (must be non-negative)
    const numClips = parseInt(document.getElementById("numClips").value, 10);
    if (isNaN(numClips) || numClips < 0) {
      alert("Number of clips must be a non-negative number.");
      return;
    }
  
    // Validate Volume per Clip (must be non-negative and in increments of 1,000)
    const volPerClipInput = document.getElementById("volPerClip").value;
    let volPerClip = parseInt(volPerClipInput, 10);
    if (isNaN(volPerClip) || volPerClip < 0) {
      alert("Volume per clip must be a non-negative number.");
      return;
    }
    if (volPerClip % 1000 !== 0) {
      alert("Volume per clip must be in increments of 1,000.");
      return;
    }
    const formattedVolume = formatVolume(volPerClip);
  
    // Get timer hours and calculate deadline (in ms)
    const timerHours = parseFloat(document.getElementById("timerHours").value);
    if (isNaN(timerHours) || timerHours <= 0) {
      alert("Please enter a valid number of hours for the timer.");
      return;
    }
    const deadline = Date.now() + timerHours * 3600 * 1000; // hours to ms
  
    // Build legs details
    const legs = [];
    document.querySelectorAll(".leg").forEach((leg) => {
      const strike = leg.querySelector(".strike").value;
      const type = leg.querySelector(".type").value;
      legs.push(`${type} @ ${strike}`);
    });
  
    // Insert separate rows in the Open Orders table for each clip,
    // each with its own unique ID.
    const ordersTable = document.getElementById("ordersTable");
    for (let i = 0; i < numClips; i++) {
      const uniqueID = generateOrderID();
      const row = ordersTable.insertRow();
      row.innerHTML = `
        <td>${uniqueID}</td>
        <td>${contractMonthFormatted}</td>
        <td>${maxPremium}</td>
        <td>${formattedVolume}</td>
        <td>${legs.join("<br>")}</td>
        <td><span class="timer" data-deadline="${deadline}">Calculating...</span></td>
        <td>
          <button class="lock-btn" onclick="lockOrder(this)">Lock</button>
          <button class="delete-btn" onclick="deleteOrder(this)">Delete</button>
        </td>
      `;
    }
  
    // Reset the form and clear option legs
    document.getElementById("optionsForm").reset();
    document.getElementById("legsContainer").innerHTML = "";
  });
  
  // --- Lock Order Function ---
  function lockOrder(button) {
    const row = button.parentElement.parentElement;
    const cells = row.children;
    const uniqueID = cells[0].innerText;
    const contractMonth = cells[1].innerText;
    const premium = cells[2].innerText;
    const volume = cells[3].innerText;
    const legDetails = cells[4].innerHTML;
    const timerHTML = cells[5].innerHTML;
  
    // Remove the row from Open Orders
    row.parentElement.removeChild(row);
  
    // Insert the row into Locked Orders with updated status
    const lockedOrdersTable = document.getElementById("lockedOrdersTable");
    const lockedRow = lockedOrdersTable.insertRow();
    lockedRow.innerHTML = `
      <td>${uniqueID}</td>
      <td>${contractMonth}</td>
      <td>${premium}</td>
      <td>${volume}</td>
      <td>${legDetails}</td>
      <td>${timerHTML}</td>
      <td class="statusCell">Locked</td>
      <td>
        <button class="fill-btn" onclick="markFilled(this)">Mark Filled</button>
        <button class="return-btn" onclick="returnOrder(this)">Return</button>
      </td>
    `;
  }
  
  // --- Generate Unique Order ID ---
  function generateOrderID() {
    return "ORD" + Date.now() + Math.floor(Math.random() * 1000);
  }
  
  // --- Mark Order as Filled ---
  function markFilled(button) {
    const row = button.parentElement.parentElement;
    // Update the status cell to "Filled"
    row.querySelector(".statusCell").textContent = "Filled";
    // Disable the "Mark Filled" button and the "Return" button
    button.disabled = true;
    button.textContent = "Filled";
    const returnBtn = row.querySelector(".return-btn");
    if (returnBtn) {
      returnBtn.disabled = true;
      returnBtn.style.opacity = "0.5";
    }
    // Increase global filled orders counter and update display
    filledCount++;
    document.getElementById("filledCount").textContent = `(Filled: ${filledCount})`;
  }
  
  // --- Return Order Function (from Locked to Open Orders) ---
  function returnOrder(button) {
    const row = button.parentElement.parentElement;
    // Only allow return if order is still unfilled (status = "Locked")
    if (row.querySelector(".statusCell").textContent !== "Locked") {
      return;
    }
  
    // Extract data from the locked order row
    const cells = row.children;
    const uniqueID = cells[0].innerHTML;
    const contractMonth = cells[1].innerHTML;
    const premium = cells[2].innerHTML;
    const volume = cells[3].innerHTML;
    const legDetails = cells[4].innerHTML;
    const timerHTML = cells[5].innerHTML;
  
    // Create a new row in the Open Orders table with the same unique ID
    const ordersTable = document.getElementById("ordersTable");
    const newRow = ordersTable.insertRow();
    newRow.innerHTML = `
      <td>${uniqueID}</td>
      <td>${contractMonth}</td>
      <td>${premium}</td>
      <td>${volume}</td>
      <td>${legDetails}</td>
      <td>${timerHTML}</td>
      <td>
        <button class="lock-btn" onclick="lockOrder(this)">Lock</button>
        <button class="delete-btn" onclick="deleteOrder(this)">Delete</button>
      </td>
    `;
  
    // Remove the row from Locked Orders table
    row.parentElement.removeChild(row);
  }
  
  // --- Delete Order from Open Orders ---
  function deleteOrder(button) {
    const row = button.parentElement.parentElement;
    row.parentElement.removeChild(row);
  }
  
  // --- Delete Order from Locked Orders ---
  function deleteLockedOrder(button) {
    const row = button.parentElement.parentElement;
    // If the order is marked as Filled, optionally decrement the counter
    if (row.querySelector(".statusCell").textContent === "Filled") {
      filledCount = Math.max(0, filledCount - 1);
      document.getElementById("filledCount").textContent = `(Filled: ${filledCount})`;
    }
    row.parentElement.removeChild(row);
  }
  
  // --- Global Timer Update Function ---
  function updateTimers() {
    const timerElements = document.querySelectorAll(".timer");
    const now = Date.now();
  
    timerElements.forEach(timerEl => {
      const deadline = parseInt(timerEl.getAttribute("data-deadline"), 10);
      let diff = deadline - now;
  
      // If time has expired
      if (diff <= 0) {
        timerEl.textContent = "Expired";
        return;
      }
  
      // Calculate hours, minutes, seconds
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
  
      // Format with two digits
      timerEl.textContent = 
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`;
    });
  }
  
  // Run updateTimers every second
  setInterval(updateTimers, 1000);
  
  // --- Tab Switching Functionality ---
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      // Remove active class from all tab buttons
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      // Add active class to the clicked button
      this.classList.add("active");
  
      // Hide all orders sections
      document.querySelectorAll(".orders-section").forEach(section => {
        section.style.display = "none";
      });
      // Show the selected tab's section
      const selectedTab = this.getAttribute("data-tab");
      document.getElementById(selectedTab).style.display = "block";
    });
  });
  