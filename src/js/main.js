'use strict';
import { DATA_SUPPLEMENTAL as data } from './dataReference.js';
import loadDropdownOptions from './renderDropdowns.js';
import Calculation from './renderCalculation.js';

/**
 * Application entry module.
 * - Normalizes user input formatting (focus/blur behavior)
 * - Initializes dropdown options from static reference data
 * - Wires the calculator engine to DOM elements
 */
const CURRENCY_PATTERN = /[^0-9.-]+/g;
const THOUSAND_SEPARATOR_PATTERN = /\d(?=(\d{3})+\.)/g;

// Keeps text fields currency-friendly while preserving manual user entry flow.
const activateInputWatcher = () => {
  const inputs = document.querySelectorAll('form input');

  const onFocus = e => {
    const input = e.target;
    const rawValue = input.value;
    const isNaNMarker = rawValue === '*Not-A-Number*' || rawValue === '*NAN*';

    if (isNaNMarker || !rawValue) {
      input.classList.remove('not-a-number');
      input.classList.add('reset-not-a-number');
      input.value = '';
      return;
    }

    input.value = Number(String(rawValue).replace(CURRENCY_PATTERN, ''));
  };

  const onBlur = e => {
    const input = e.target;
    const value = input.value;
    const parsed = Number.parseFloat(value);
    const isNumeric = Number.isFinite(parsed);

    if (isNumeric) {
      input.value = parsed.toFixed(2).replace(THOUSAND_SEPARATOR_PATTERN, '$&,');
      return;
    }

    if (value) {
      input.classList.add('not-a-number');
      input.value = input.matches('.tax') ? '*NAN*' : '*Not-A-Number*';
      return;
    }

    input.value = '';
  };

  inputs.forEach(el => {
    if (el.readOnly) return;
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', onBlur);
  });

  // Keep existing Bootstrap tooltip behavior.
  $(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
};

// Wires input elements into the calculation engine.
const calculateLeases = function ({ moneyFactor, points, paymentFrequency }) {
  const values = document.querySelectorAll('select, input');
  const inputElements = {
    basePrice: document.querySelector('.base_selling_price'),
    sellingPrice: document.querySelector('.selling_price'),
    capSubtotal: document.querySelector('.cap_subtotal'),
    taxCap: document.querySelector('.taxes_2'),
    capCost: document.querySelector('.capitalized_cost'),
    totalReduction: document.querySelector('.total_reduction'),
    netLease: document.querySelector('.net_lease'),
    residualAmount: document.querySelector('.residual_amount'),
    adjustedResidual: document.querySelector('.adjusted_residual'),
    numberOfPayments: document.querySelector('.number_of_payments'),
    totalKms: document.querySelector('.total_kms'),
    buyOption: document.querySelector('.buy_option'),
    basePayment: document.querySelector('.base_payment'),
    pst2: document.querySelector('.pst_2'),
    gstHst2: document.querySelector('.gst_hst_2'),
    payment: document.querySelector('.payment'),
    paymentHint: document.querySelector('.payment_hint'),
    resetBtn: document.querySelector('.reset_lease_btn'),
  };

  const amounts = new Calculation(values, moneyFactor, points, paymentFrequency);
  amounts.calculate(inputElements);
};

// App bootstrap sequence: UI helpers, dropdown data, then calculations.
const init = function () {
  activateInputWatcher();
  loadDropdownOptions(this);
  calculateLeases(this);
};

document.addEventListener('DOMContentLoaded', init.bind(data));
