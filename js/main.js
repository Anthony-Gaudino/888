/**
 * Known issues:
 *   * The current date is gathered from the user device, which means that the
 *   user can set any date in past or future and so this date could not be
 *   correct. A better way would be to get the current date from a remote
 *   server.
 *   * The user can input any date in future, if he does this the price of
 *   BitCoin will not be found in CoinGecko API.
 *   * Form validation is minimal.
 *   * API calls error handling is minimal.
 *   * It was not well explained how the table rows should behave, the first
 *   screen shows empty cells with a brighter background and then filled cells
 *   with a darker background. My implementation displays both types of rows.
 *   * Tested only on Firefox 94.0.
 */

document.addEventListener('DOMContentLoaded', event => {
  const button    = document.getElementById('submitButton');
  const inputDate = document.getElementById('dateInput');
  const table     = document.getElementById('tableBody');

  /**
   * Adds click event to SUBMIT button.
   */
  button.addEventListener('click', async event => {
    const date = inputDate.valueAsDate;

    if (!date) {
      alert('You must enter a date and time!')

      return;
    }

    try {
      const nextDrawDate = getNextLottoDraw(date);
      const dateStr      = `${nextDrawDate.getDate()}-${nextDrawDate.getMonth()}`
                         + `-${nextDrawDate.getFullYear()} `
                         + `${nextDrawDate.toTimeString().substring(0,5)}`;
      const btcVal       = await calculateBitCoinValue(nextDrawDate);

      const firstRow     = table.firstElementChild;
      const dateCellBody = firstRow.firstElementChild.firstElementChild;
      const btcCellBody  = firstRow.lastElementChild.firstElementChild;

      dateCellBody.innerText = dateStr;
      btcCellBody.innerText  = btcVal;

      firstRow.classList.add("filled", "fade-in-down");
      dateCellBody.classList.add("fade-in");
      btcCellBody.classList.add( "fade-in");

      firstRow.insertAdjacentHTML('beforebegin', `
        <tr class="table__body-row">
          <td class="table__body-cell"><div class="table__cell-body"></div></td>
          <td class="table__body-cell"><div class="table__cell-body"></div></td>
        </tr>
    `);
    } catch(e) {
      alert(e.message);
    }
  });
});

/**
 * Given a date returns the next Lotto draw date.
 * Lotto draws happen every Wednesday and Saturday at 8pm.
 *
 * @example
 *   getNextLottoDraw(new Date('Nov 21, 2021'));         // Wed Nov 24 2021 20:00:00
 *   getNextLottoDraw(new Date('Nov 22, 2021'));         // Wed Nov 24 2021 20:00:00
 *   getNextLottoDraw(new Date('Nov 23, 2021'));         // Wed Nov 24 2021 20:00:00
 *   getNextLottoDraw(new Date('Nov 24, 2021'));         // Wed Nov 24 2021 20:00:00
 *   getNextLottoDraw(new Date('Nov 24, 2021, 20:00'));  // Fri Nov 26 2021 20:00:00
 *   getNextLottoDraw(new Date('Nov 26, 2021'));         // Fri Nov 26 2021 20:00:00
 *   getNextLottoDraw(new Date('Nov 26, 2021, 20:00'));  // Wed Dec 01 2021 20:00:00
 *   getNextLottoDraw(new Date('Nov 27, 2021'));         // Wed Dec 01 2021 20:00:00
 *
 * @param {Date} date - The reference date.
 *
 * @return {Date} The draw date.
 */
const getNextLottoDraw = (date = new Date()) => {
  const wednesday = 3;
  const friday    = 5;

  let weekDay = date.getDay();
  let diff    = 0;

  if (date.getHours() >= 8 && (weekDay === wednesday || weekDay === friday)) {
    date.setDate(date.getDate() + 1);

    weekDay = date.getDay();
  }

  if (weekDay <= wednesday) {
    diff = wednesday - weekDay;
  } else if (weekDay <= friday) {
    diff = friday - weekDay;
  } else {
    diff = (weekDay - friday) + wednesday;
  }

  date.setDate(date.getDate() + diff);
  date.setHours(20, 0, 0, 0);

  return date;
};

/**
 * Gets the BitCoin price in Euro given a date. If no date is given retrieves
 * the current BitCoin price.
 *
 * @param {?Date} date - The date to retrieve the BitCoin price or `null` to
 *     retrieve the current price.
 *
 * @return {Number} The BitCoin price.
 */
const getBitCoinPrice = async date => {
  const dateStr = date
                ? `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`
                : null;
  const apiBaseUrl = 'https://api.coingecko.com/api/v3/coins/bitcoin';
  const url = date ? `${apiBaseUrl}/history?date=${dateStr}` : apiBaseUrl;

  const response = await fetch(url);

  if (!response.ok || (response.status >= 400 && response.status < 600)) {
    throw new Error("Error fetching data from CoinGecko!");
  }

  const data = await response.json();

  return data.market_data.current_price.eur;
};

/**
 * Calculates what 100 EUR of BitCoin purchased at a previous date would be
 * worth today.
 *
 * @param {Date} date - A date in the past that will be used to retrieve the
 *     BitCoin price at that time.
 *
 * @return {Number} The value in EUR.
 */
const calculateBitCoinValue = async date => {
  const currentBtcPrice  = await getBitCoinPrice();
  const previousBtcPrice = await getBitCoinPrice(date);

  return currentBtcPrice * 100 / previousBtcPrice;
};
