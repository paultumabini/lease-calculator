'use strict';
import { DATA_SUPPLEMENTAL as data } from './dataReference.js';
import loadDropdownOptions from './renderDropdowns.js';
import Calculation from './renderCalculation.js';

//check input values
const activateInputWatcher = () => {
  const inputs = document.querySelectorAll('form input');

  const onFocus = function (e) {
    const value = e.target.value;
    const resetNotANumber = () => (e.target.classList.remove('not-a-number'), e.target.classList.add('reset-not-a-number'), '');
    e.target.value = value !== '*Not-A-Number*' && value !== '*NAN*' && value ? +String(value).replace(this, '') : resetNotANumber();
  };

  const onBlur = function (e) {
    const value = e.target.value;
    const notANumber = () => (e.target.classList.add('not-a-number'), e.target.matches('.tax') ? '*NAN*' : '*Not-A-Number*');
    e.target.value =
      !isNaN(parseFloat(value)) && isFinite(value) ? (+value).toFixed(2).replace(this, '$&,') : isNaN(value) ? notANumber() : '';
  };

  inputs.forEach(el => {
    if (el.readOnly) return;
    el.addEventListener('focus', onFocus.bind(/[^0-9.-]+/g));
    el.addEventListener('blur', onBlur.bind(/\d(?=(\d{3})+\.)/g));
  });

  $(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
};

// get input values and render calculations
const calculateLeases = function ({ moneyFactor, points, paymentFrequency }) {
  const values = document.querySelectorAll('select,input');
  const inputElements = {
    basePrice: document.querySelector('.base_selling_price'),
    sellingPrice: document.querySelector('.selling_price'),
    capSubtotal: document.querySelector('.cap_subtotal'),
    taxCap: document.querySelector('.taxes_2'),
    capCost: document.querySelector('.capitalized_cost'),
    totalReduction: document.querySelector('.total_reduction'),
    netLease: document.querySelector('.net_lease'),
    residualAmount: document.querySelector('.residual_amount'),
    adustedResidual: document.querySelector('.adusted_residual'),
    numberOfPayments: document.querySelector('.number_of_payments'),
    totalKms: document.querySelector('.total_kms'),
    buyOption: document.querySelector('.buy_option'),
    basePayment: document.querySelector('.base_payment'),
    pst2: document.querySelector('.pst_2'),
    gsthst2: document.querySelector('.gst_hst_2'),
    payment: document.querySelector('.payment'),
    resetBtn: document.querySelector('.reset_lease_btn'),
  };

  const amounts = new Calculation(values, moneyFactor, points, paymentFrequency);
  amounts.calculate(inputElements);
};

const init = function () {
  activateInputWatcher();
  loadDropdownOptions(this);
  calculateLeases(this);
};

document.addEventListener('DOMContentLoaded', init.bind(data));
