'use strict';
// Render  dropdown options
const loadOptionElements = (element, content) => {
  const options = document.createElement('option');
  options.textContent = content;
  element.appendChild(options);
};

const getSelectedMake = function (e) {
  this.limits.forEach(el => {
    if (Object.keys(el)[0] === e.target.value) {
      this.kms.innerHTML = `<option>Choose...</option>`;
      Object.values(el)[0].forEach(km => {
        loadOptionElements(this.kms, km);
      });
    }
  });
};

const interateOptions = (options, dropdown, func) => {
  options.forEach(option => {
    option = typeof option === 'object' && !Array.isArray(option) && option !== null ? Object.keys(option)[0] : option;
    func(dropdown, option);
  });
};

const loadDropdownOptions = ({ mileageLimits, terms, paymentFrequency }) => {
  const makesDropdown = document.querySelector('.makes');
  const kmsDropdown = document.querySelector('.annual_km');
  const termsDropdown = document.querySelector('.terms');
  const pmtFreqDropdown = document.querySelector('.payment_frequency');

  interateOptions(mileageLimits, makesDropdown, loadOptionElements);
  interateOptions(terms, termsDropdown, loadOptionElements);
  interateOptions(Object.keys(paymentFrequency), pmtFreqDropdown, loadOptionElements);

  makesDropdown.addEventListener('change', getSelectedMake.bind({ limits: mileageLimits, kms: kmsDropdown }));
};

export default loadDropdownOptions;
