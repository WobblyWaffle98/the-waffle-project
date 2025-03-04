// Global array to hold orders
let orders = [];

// On page load, load orders from localStorage and display them
window.addEventListener("load", function() {
  loadOrdersFromLocalStorage();
  
  // Set up tab functionality
  setupTabs();
});

// Function to set up tab behavior
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabSections = document.querySelectorAll(".orders-section");

  tabButtons.forEach(button => {
    button.addEventListener("click", function() {
      const targetTab = this.getAttribute("data-tab");

      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      // Hide all sections and show the selected one
      tabSections.forEach(section => section.classList.remove("active"));
      document.getElementById(targetTab).classList.add("active");
    });
  });
}

// Load orders from localStorage
function loadOrdersFromLocalStorage() {
  const storedOrders = localStorage.getItem("orders");
  if (storedOrders) {
    orders = JSON.parse(storedOrders);
    renderOrdersByStatus();
  }
}

// Save orders to localStorage
function saveOrdersToLocalStorage() {
  localStorage.setItem("orders", JSON.stringify(orders));
}

// Render orders by their status into appropriate tables
function renderOrdersByStatus() {
  // Clear all tables first
  document.getElementById("openOrdersTable").innerHTML = "";
  document.getElementById("lockedOrdersTable").innerHTML = "";
  document.getElementById("filledOrdersTable").innerHTML = "";
  document.getElementById("expiredOrdersTable").innerHTML = "";
  
  // Filter orders by status and render to appropriate tables
  orders.forEach(order => {
    if (order.status === "open") {
      insertOpenOrder(order);
    } else if (order.status === "locked") {
      insertLockedOrder(order);
    } else if (order.status === "filled") {
      insertFilledOrder(order);
    } else if (order.status === "expired") {
      insertExpiredOrder(order);
    }
  });
  
  // Add event listeners to delete buttons after rendering
  addDeleteButtonListeners();
}

// Function to add event listeners to all delete buttons
function addDeleteButtonListeners() {
  document.querySelectorAll(".delete-btn").forEach(button => {
    button.removeEventListener("click", handleDeleteClick); // Remove any existing listeners
    button.addEventListener("click", handleDeleteClick); // Add fresh listener
  });
}

// Handle delete button click
function handleDeleteClick(event) {
  const orderId = event.target.getAttribute("data-order-id");
  deleteOrder(orderId);
}


// --- Add Option Leg Functionality ---
document.getElementById("addLeg").addEventListener("click", function () {
  const legsContainer = document.getElementById("legsContainer");
  const legDiv = document.createElement("div");
  legDiv.classList.add("leg");

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

// --- Form Submission and Order Creation (Mandate Giver) ---
document.getElementById("optionsForm").addEventListener("submit", function (event) {
  event.preventDefault();

  // Format contract month as MMM, YY
  const contractMonthInput = document.getElementById("contractMonth").value;
  const contractDate = new Date(contractMonthInput + "-01");
  const contractMonthFormatted = contractDate.toLocaleString("en-US", { month: "short", year: "2-digit" });

  const maxPremium = parseFloat(document.getElementById("maxPremium").value).toFixed(2);
  if (isNaN(maxPremium)) {
    alert("Please enter a valid premium value.");
    return;
  }

  const numClips = parseInt(document.getElementById("numClips").value, 10);
  if (isNaN(numClips) || numClips < 0) {
    alert("Number of clips must be a non-negative number.");
    return;
  }

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
  const formattedVolume = Number(volPerClip).toLocaleString('en-US');

  const timerHours = parseFloat(document.getElementById("timerHours").value);
  if (isNaN(timerHours) || timerHours <= 0) {
    alert("Please enter a valid number of hours for the timer.");
    return;
  }
  const deadline = Date.now() + timerHours * 3600 * 1000; // convert hours to milliseconds

  // Build option legs details
  const legs = [];
  document.querySelectorAll(".leg").forEach((leg) => {
    const strike = leg.querySelector(".strike").value;
    const type = leg.querySelector(".type").value;
    legs.push(`${type} @ ${strike}`);
  });

  // Create an order for each clip and add to orders array and DOM
  for (let i = 0; i < numClips; i++) {
    const uniqueID = generateOrderID();
    const order = {
      id: uniqueID,
      contractMonth: contractMonthFormatted,
      maxPremium: maxPremium,
      volume: formattedVolume,
      legs: legs,
      deadline: deadline,
      status: "open" // possible values: "open", "locked", "filled", "expired"
    };

    orders.push(order);
  }

  // Save orders to localStorage and render them
  saveOrdersToLocalStorage();
  renderOrdersByStatus();

  // Reset the form and clear option legs
  document.getElementById("optionsForm").reset();
  document.getElementById("legsContainer").innerHTML = "";
});

// --- Helper Functions ---

// Generate a Unique Order ID
function generateOrderID() {
  return "ORD" + Date.now() + Math.floor(Math.random() * 1000);
}

// Get the color based on the order status
function getStatusColor(status) {
  switch (status) {
    case "filled":
      return "green"; // filled
    case "locked":
      return "orange"; // locked
    case "expired":
      return "red"; // expired
    default:
      return "transparent"; // default color
  }
}

// Format a status badge
function getStatusBadge(status) {
  return `<span class="status-badge status-${status}">${status}</span>`;
}

// Insert an open order into the Open Orders table
function insertOpenOrder(order) {
  const ordersTable = document.getElementById("openOrdersTable");
  const row = ordersTable.insertRow();
  
  row.innerHTML = `
    <td>${order.id}</td>
    <td>${order.contractMonth}</td>
    <td>${order.maxPremium}</td>
    <td>${order.volume}</td>
    <td>${order.legs.join("<br>")}</td>
    <td><span class="timer" data-deadline="${order.deadline}">Calculating...</span></td>
    <td>${getStatusBadge(order.status)}</td>
    <td>
      <button class="delete-btn" data-order-id="${order.id}">Delete</button>
    </td>
  `;
}

// Insert a locked order into the Locked Orders table
function insertLockedOrder(order) {
  const ordersTable = document.getElementById("lockedOrdersTable");
  const row = ordersTable.insertRow();
  
  // Status display that includes trader ID if available
  let statusDisplay = `${getStatusBadge(order.status)}`;
  if (order.traderId) {
    statusDisplay += `<div>by ${order.traderId}</div>`;
    if (order.lockedTime) statusDisplay += `<small>${order.lockedTime}</small>`;
  }
  
  row.innerHTML = `
    <td>${order.id}</td>
    <td>${order.contractMonth}</td>
    <td>${order.maxPremium}</td>
    <td>${order.volume}</td>
    <td>${order.legs.join("<br>")}</td>
    <td><span class="timer" data-deadline="${order.deadline}">Calculating...</span></td>
    <td>${statusDisplay}</td>
    <td>
      <span class="disabled-action">Cannot delete</span>
    </td>
  `;
}

// Insert a filled order into the Filled Orders table
function insertFilledOrder(order) {
  const ordersTable = document.getElementById("filledOrdersTable");
  const row = ordersTable.insertRow();
  
  // Status display that includes trader ID
  let statusDisplay = `${getStatusBadge(order.status)}`;
  if (order.traderId) {
    statusDisplay += `<div>by ${order.traderId}</div>`;
    if (order.filledTime) statusDisplay += `<small>${order.filledTime}</small>`;
  }
  
  // Prepare fill details section
  let fillDetailsHTML = '';
  
  if (order.fillDetails) {
    const { netPremium, legDetails, counterparty, remarks } = order.fillDetails;
    
    // Start fill details section
    fillDetailsHTML = `<div class="fill-details">`;
    
    // Net premium
    fillDetailsHTML += `
      <div class="detail-item">
        <span class="detail-label">Net Premium:</span>
        <span class="detail-value">$${netPremium.toFixed(2)}</span>
      </div>
    `;
    
    // Leg premiums
    if (legDetails && legDetails.length > 0) {
      for (let i = 0; i < legDetails.length; i++) {
        fillDetailsHTML += `
          <div class="detail-item">
            <span class="detail-label">Leg ${i + 1} (${legDetails[i].action}):</span>
            <span class="detail-value">$${legDetails[i].premium.toFixed(2)}</span>
          </div>
        `;
        }
    }
    
    // Counterparty
    if (counterparty) {
      fillDetailsHTML += `
        <div class="detail-item">
          <span class="detail-label">Counterparty:</span>
          <span class="detail-value">${counterparty}</span>
        </div>
      `;
    }
    
    // Remarks (if any)
    if (remarks) {
      fillDetailsHTML += `
        <div class="detail-item">
          <span class="detail-label">Remarks:</span>
          <span class="detail-value">${remarks}</span>
        </div>
      `;
    }
    
    // Close fill details div
    fillDetailsHTML += `</div>`;
  } else {
    fillDetailsHTML = `<div class="fill-details">No fill details available</div>`;
  }
  
  row.innerHTML = `
    <td>${order.id}</td>
    <td>${order.contractMonth}</td>
    <td>${order.maxPremium}</td>
    <td>${order.volume}</td>
    <td>${order.legs.join("<br>")}</td>
    <td>${fillDetailsHTML}</td>
    <td>${statusDisplay}</td>
    <td>
      <span class="disabled-action">Cannot delete</span>
    </td>
  `;
}

// Insert an expired order into the Expired Orders table
function insertExpiredOrder(order) {
  const ordersTable = document.getElementById("expiredOrdersTable");
  const row = ordersTable.insertRow();
  
  // Format expiry time
  const expiryDate = new Date(parseInt(order.deadline));
  const expiryTimeFormatted = expiryDate.toLocaleString();
  
  row.innerHTML = `
    <td>${order.id}</td>
    <td>${order.contractMonth}</td>
    <td>${order.maxPremium}</td>
    <td>${order.volume}</td>
    <td>${order.legs.join("<br>")}</td>
    <td>${expiryTimeFormatted}</td>
    <td>${getStatusBadge(order.status)}</td>
    <td>
      <span class="disabled-action">Cannot delete</span>
    </td>
  `;
}

// Delete Order (Mandate Giver Only - Only Open Orders)
function deleteOrder(orderId) {
  // Filter out the order that needs to be deleted
  orders = orders.filter(order => order.id !== orderId);

  // Save updated orders to localStorage
  saveOrdersToLocalStorage();

  // Re-render orders
  renderOrdersByStatus();
}

// --- Global Timer Update Function ---
function updateTimers() {
  const timerElements = document.querySelectorAll(".timer");
  const now = Date.now();

  timerElements.forEach(timerEl => {
    const deadline = parseInt(timerEl.getAttribute("data-deadline"), 10);
    let diff = deadline - now;

    if (diff <= 0) {
      timerEl.textContent = "Expired";
      // Find the order ID from the row
      const row = timerEl.closest('tr');
      if (row) {
        const orderId = row.cells[0].textContent; // Get the order ID from the first cell
        // Find and update the order status to expired
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1 && orders[orderIndex].status === "open") {
          orders[orderIndex].status = "expired"; // Update status to expired
          saveOrdersToLocalStorage(); // Save updated orders
          renderOrdersByStatus(); // Re-render orders to move to expired tab
        }
      }
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    timerEl.textContent =
      `${hours.toString().padStart(2, '0')}:` +
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}`;
  });
}
setInterval(updateTimers, 1000);

// Navigate back to homepage
function goHome() {
  window.location.href = "index.html";
}

// Listen for storage events to update in real-time if changed by trader page
window.addEventListener('storage', (event) => {
  if (event.key === "orders") {
    loadOrdersFromLocalStorage();
  }
});

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add direct event listeners to any existing delete buttons
  addDeleteButtonListeners();
});



