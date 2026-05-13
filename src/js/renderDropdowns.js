'use strict';

/**
 * Dropdown renderer module.
 * Loads make/term/payment-frequency options and updates annual KM options
 * based on the selected vehicle make.
 */
// Appends an option element to a target dropdown.
const appendOption = (dropdown, content) => {
  const option = document.createElement('option');
  option.textContent = content;
  dropdown.appendChild(option);
};

// Normalizes option data that can be primitives or single-key objects.
const normalizeOptionValue = option => {
  if (typeof option === 'object' && !Array.isArray(option) && option !== null) {
    return Object.keys(option)[0];
  }
  return option;
};

const populateDropdown = (options, dropdown) => {
  options.forEach(option => {
    appendOption(dropdown, normalizeOptionValue(option));
  });
};

const onMakeSelected = function (e) {
  const selectedMake = e.target.value;
  const makeMileageEntry = this.limits.find(limit => Object.keys(limit)[0] === selectedMake);

  this.kms.innerHTML = '<option>Choose...</option>';

  if (!makeMileageEntry) return;

  Object.values(makeMileageEntry)[0].forEach(km => {
    appendOption(this.kms, km);
  });
};

const loadDropdownOptions = ({ mileageLimits, terms, paymentFrequency }) => {
  // Query once and reuse references to avoid repeated DOM traversal.
  const makesDropdown = document.querySelector('.makes');
  const kmsDropdown = document.querySelector('.annual_km');
  const termsDropdown = document.querySelector('.terms');
  const paymentFrequencyDropdown = document.querySelector('.payment_frequency');

  populateDropdown(mileageLimits, makesDropdown);
  populateDropdown(terms, termsDropdown);
  populateDropdown(Object.keys(paymentFrequency), paymentFrequencyDropdown);

  makesDropdown.addEventListener('change', onMakeSelected.bind({ limits: mileageLimits, kms: kmsDropdown }));
};

export default loadDropdownOptions;
