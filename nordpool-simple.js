let CONFIG = {
  api_endpoint: "https://dashboard.elering.ee/api/nps/price/ee/current",
  switchId: 0,             // ID of the switch to control
  update_time: 60000,      // 1 minute. Price update interval in milliseconds
  lowest_price_hours_count: 3, // Number of lowest price hours to consider
  price_hours: [],         // Array to store the hours with the lowest prices
};

let current_price = null;
let state = null;

// Function to get current price data from the API
function getCurrentPrice() {
  fetch(CONFIG.api_endpoint)
    .then(response => response.json())
    .then(data => {
      current_price = data.data.prices[0].price;
      console.log("Updated current price!");
    })
    .catch(error => console.error('Error fetching price data:', error));
}

// Function to update the list of lowest price hours
function updateLowestPriceHours() {
  fetch(CONFIG.api_endpoint)
    .then(response => response.json())
    .then(data => {
      CONFIG.price_hours = data.data.prices.slice(0, CONFIG.lowest_price_hours_count).map(priceData => {
        return new Date(priceData.timestamp).getHours();
      });
      console.log("Updated lowest price hours:", CONFIG.price_hours);
    })
    .catch(error => console.error('Error fetching price data:', error));
}

// Function to change switch state based on current price and lowest price hours
function changeSwitchState() {
  let currentHour = new Date().getHours();
  if (CONFIG.price_hours.includes(currentHour)) {
    // If the current hour is one of the lowest price hours, switch on
    console.log("Switching on!");
    state = true;
  } else {
    // Otherwise, switch off
    console.log("Switching off!");
    state = false;
  }

  // Call Shelly API to change switch state
  Shelly.call(
    "Switch.Set",
    {
      id: CONFIG.switchId,
      on: state,
    },
    function (response, error_code, error_message) {
      if (error_code !== 0) {
        console.error(error_message);
      }
    }
  );
}

// Function to periodically update price data and switch state
function updateAndCheckPrice() {
  getCurrentPrice();
  changeSwitchState();
}

// Initialize by updating lowest price hours and starting the timer
updateLowestPriceHours();
setInterval(updateAndCheckPrice, CONFIG.update_time);
