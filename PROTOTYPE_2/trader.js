// Global filled orders counter and orders array (loaded from localStorage on page load)

let orders = [];

// Load orders from localStorage on trader page load
function loadOrdersFromLocalStorage() {
  const storedOrders = localStorage.getItem("orders");
  if (storedOrders) {
    orders = JSON.parse(storedOrders);
  }
  renderOrders();
}

// Save orders to localStorage
function saveOrdersToLocalStorage() {
  localStorage.setItem("orders", JSON.stringify(orders));
}

// Update an order’s status in the global array and persist it
function updateOrderStatus(orderId, newStatus) {
  orders = orders.map(order => {
    if (order.id === orderId) {
      return { ...order, status: newStatus };
    }
    return order;
  });
  saveOrdersToLocalStorage();
}

// Render orders into the appropriate tables on the trader page
function renderOrders() {
  const openOrdersTable = document.getElementById("ordersTable");
  const lockedOrdersTable = document.getElementById("lockedOrdersTable");

  // Clear current table contents
  openOrdersTable.innerHTML = "";
  lockedOrdersTable.innerHTML = "";

  orders.forEach(order => {
    // Build the timer HTML
    const timerHTML = `<span class="timer" data-deadline="${order.deadline}">Calculating...</span>`;

    if (order.status === "open") {
      // Render in Open Orders
      const row = openOrdersTable.insertRow();
      row.innerHTML = `
        <td>${order.id}</td>
        <td>${order.contractMonth}</td>
        <td>${order.maxPremium}</td>
        <td>${order.volume}</td>
        <td>${order.legs.join("<br>")}</td>
        <td>${timerHTML}</td>
        <td>
          <button class="lock-btn" onclick="lockOrder(this)">Lock</button>
        </td>
      `;
    } else if (order.status === "locked" || order.status === "filled") {
      // Render in Locked Orders
      const row = lockedOrdersTable.insertRow();
      
      // Status display that includes trader ID
      const statusDisplay = order.status === "locked" 
        ? `Locked by ${order.traderId}<br><small>${order.lockedTime || ""}</small>` 
        : `Filled by ${order.traderId}<br><small>${order.filledTime || ""}</small>`;
      
      // Determine if current trader can interact with this order
      const isOwner = order.traderId === currentTraderId;
      
      // Only show fill/return buttons if this trader locked the order
      const actionButtons = order.status === "locked" 
  ? (isOwner 
      ? `<button class="fill-btn" onclick="markFilled(this)">Fill</button>
         <button class="return-btn" onclick="returnOrder(this)">Return</button>`
      : `<span class="action-disabled">Locked by another trader</span>`)
    : `<span class="action-disabled">Filled order</span>`;
      
      row.innerHTML = `
        <td>${order.id}</td>
        <td>${order.contractMonth}</td>
        <td>${order.maxPremium}</td>
        <td>${order.volume}</td>
        <td>${order.legs.join("<br>")}</td>
        <td>${timerHTML}</td>
        <td class="statusCell">${statusDisplay}</td>
        <td>${actionButtons}</td>
      `;
    }
  });
}

// --- Trader Functions ---

// Load trader ID from session storage
let currentTraderId = '';
window.addEventListener("load", function() {
  currentTraderId = sessionStorage.getItem('traderId') || 'Unknown';
  document.getElementById('currentTraderDisplay').textContent = `Logged in as: ${currentTraderId}`;
  loadOrdersFromLocalStorage();
});

// Lock Order: update status to "locked" and re-render
function lockOrder(button) {
  // Get the unique order ID from the row
  const row = button.parentElement.parentElement;
  const uniqueID = row.cells[0].innerText;
  
  // Update the order's status and add trader ID
  orders = orders.map(order => {
    if (order.id === uniqueID) {
      return { 
        ...order, 
        status: "locked",
        traderId: currentTraderId,
        lockedTime: new Date().toLocaleString()
      };
    }
    return order;
  });
  
  saveOrdersToLocalStorage();
  renderOrders();
}

// Mark Order as Filled: redirect to fill order page
function markFilled(button) {
  const row = button.parentElement.parentElement;
  const uniqueID = row.cells[0].innerText;
  
  // Store the order ID in sessionStorage for the fill page to use
  sessionStorage.setItem('fillOrderId', uniqueID);
  
  // Redirect to the fill order page
  window.location.href = 'fill-order.html';
}

// Return Order: update status to "open" and re-render
function returnOrder(button) {
  const row = button.parentElement.parentElement;
  const uniqueID = row.cells[0].innerText;
  
  // Find the order in our orders array
  const order = orders.find(o => o.id === uniqueID);
  
  if (!order) {
    console.error("Order not found");
    return;
  }
  
  // Prevent returning if the order is already filled
  if (order.status === "filled") {
    alert("Filled orders cannot be returned.");
    return;
  }
  
  // Check if the current trader is the one who locked it
  if (order.traderId && order.traderId !== currentTraderId) {
    alert(`This order was locked by ${order.traderId}. Only they can return it.`);
    return;
  }

  // Update order status to "open" and remove trader ID information
  orders = orders.map(o => {
    if (o.id === uniqueID) {
      // Create a new object without the trader info
      const updatedOrder = { ...o, status: "open" };
      // Remove trader-specific properties
      delete updatedOrder.traderId;
      delete updatedOrder.lockedTime;
      delete updatedOrder.filledTime;
      return updatedOrder;
    }
    return o;
  });
  
  saveOrdersToLocalStorage();
  renderOrders();
}

// --- Global Timer Update Function (unchanged) ---
function updateTimers() {
  const timerElements = document.querySelectorAll(".timer");
  const now = Date.now();

  timerElements.forEach(timerEl => {
    const deadline = parseInt(timerEl.getAttribute("data-deadline"), 10);
    let diff = deadline - now;

    if (diff <= 0) {
      timerEl.textContent = "Expired";
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

// --- Listen for storage events so that changes from mandate.js are picked up ---
window.addEventListener('storage', (event) => {
  if (event.key === "orders") {
    loadOrdersFromLocalStorage();
  }
});

// --- Initialize Orders on Page Load ---
window.addEventListener("load", loadOrdersFromLocalStorage);

document.addEventListener("DOMContentLoaded", function () {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabSections = document.querySelectorAll(".orders-section");

  tabButtons.forEach(button => {
    button.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      // Hide all sections and show the selected one
      tabSections.forEach(section => section.style.display = "none");
      document.getElementById(targetTab).style.display = "block";
    });
  });
});

