const CURRENCY_REGEX = /[^0-9.-]+/g;
const THOUSAND_SEPARATOR_REGEX = /\d(?=(\d{3})+\.)/g;

/**
 * Core lease-calculation engine.
 * Responsible for:
 * - deriving intermediate lease values from user-entered form data
 * - rendering calculated values back to readonly UI fields
 * - validating required inputs for payment output and displaying hints
 * - clearing state/UI on reset without forcing a full-page reload
 */
class Calculation {
  constructor(prices, moneyFactor, points, paymentFrequency) {
    this.prices = prices;
    this.moneyFactor = moneyFactor;
    this.points = points;
    this.paymentFrequency = paymentFrequency;
  }

  // Converts any formatted/empty value to a safe finite number.
  static toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value !== 'string') return 0;

    const parsed = Number.parseFloat(value.replace(CURRENCY_REGEX, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  static roundToTwo(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  static formatNumber(value) {
    if (!Number.isFinite(value)) return '';
    return value.toFixed(2).replace(THOUSAND_SEPARATOR_REGEX, '$&,');
  }

  // Sums arbitrary values and returns a display-ready currency string.
  isANumberFormat(...pricing) {
    const total = pricing.reduce((acc, cur) => acc + Calculation.toNumber(cur), 0);
    return Calculation.formatNumber(total);
  }

  calcSubtotal(price) {
    return this.isANumberFormat(
      price.base,
      price.option,
      price.freight,
      price.priorLease,
      price.accessories,
      price.insureProtect,
      price.otherFees
    );
  }

  calcCapTax(price) {
    const tax = Calculation.toNumber(this.calcSubtotal(price)) * (Calculation.toNumber(price.taxCap1) / 100);
    return this.isANumberFormat(tax);
  }

  calcCapCost(price) {
    const capCost = Calculation.toNumber(this.calcSubtotal(price));
    const taxes = Calculation.toNumber(this.calcCapTax(price));
    return this.isANumberFormat(capCost + taxes);
  }

  calcCapReduction(price) {
    return this.isANumberFormat(price.rebates, price.discount, price.cashDown, price.tradeAllowance, price.lien);
  }

  calcNetLease(price) {
    const capCost = Calculation.toNumber(this.calcCapCost(price));
    const capReduction = Calculation.toNumber(this.calcCapReduction(price));
    return this.isANumberFormat(capCost - capReduction);
  }

  calcResidual(price) {
    const residualRate = Calculation.toNumber(price.residualRate);
    const residualMsrp = Calculation.toNumber(price.residualMsrp);
    return this.isANumberFormat((residualMsrp * residualRate) / 100);
  }

  calcAdjustedResidual(price) {
    const residual = Calculation.toNumber(this.calcResidual(price));
    const mileageCharges = Calculation.toNumber(price.mileageCharges);
    return this.isANumberFormat(residual + mileageCharges);
  }

  calcPayment(price, moneyFactor) {
    const residual = Calculation.toNumber(this.calcAdjustedResidual(price));
    const netLease = Calculation.toNumber(this.calcNetLease(price));
    const terms = Calculation.toNumber(price.terms);
    const rate = Calculation.toNumber(price.rate);

    const depreciation = terms > 0 ? (netLease - residual) / terms : 0;
    const moneyFactorValue = (residual + netLease) * (rate / moneyFactor);
    const basePayment = depreciation + moneyFactorValue;

    const monthly = Number.isFinite(basePayment) ? basePayment : 0;
    const biweekly = (monthly * 12) / 26;
    const weekly = (monthly * 12) / 52;

    return {
      monthly,
      biweekly,
      weekly,
      basePayment: monthly,
      tax1: Calculation.toNumber(price.pst1),
      tax2: Calculation.toNumber(price.gstHst1),
    };
  }

  // Ensures payment output is computed only when core lease inputs are present.
  getMissingRequiredPaymentInputs(pricing) {
    const requiredFields = [
      { key: 'base', label: 'MSRP' },
      { key: 'residualMsrp', label: 'Residual MSRP' },
      { key: 'residualRate', label: 'Residual %' },
      { key: 'rate', label: 'Rate %' },
      { key: 'terms', label: 'Term' },
    ];

    const missingNumeric = requiredFields
      .filter(({ key }) => Calculation.toNumber(pricing[key]) <= 0)
      .map(({ label }) => label);

    const hasPaymentFrequency = typeof pricing.paymentFrequency === 'string' && pricing.paymentFrequency.trim().length > 0;
    if (!hasPaymentFrequency) {
      missingNumeric.push('Payment Frequency');
    }

    return missingNumeric;
  }

  hasRequiredPaymentInputs(pricing) {
    return this.getMissingRequiredPaymentInputs(pricing).length === 0;
  }

  clearPaymentOutputs(paymentEl, basePaymentEl, taxEl1, taxEl2, paymentText = '0.00') {
    basePaymentEl.value = '';
    taxEl1.value = '';
    taxEl2.value = '';
    paymentEl.textContent = paymentText;
  }

  setPaymentHint(paymentHintEl, missingFields) {
    if (!paymentHintEl) return;

    const shouldShow = missingFields.length > 0;
    paymentHintEl.classList.toggle('visible', shouldShow);
    if (!shouldShow) {
      paymentHintEl.textContent = '';
      return;
    }

    const hasAnyInput = Object.values(this.pricingState ?? {}).some(value => {
      if (typeof value !== 'string') return false;
      return value.trim().length > 0;
    });

    paymentHintEl.textContent = hasAnyInput ? `Missing: ${missingFields.join(', ')}` : 'Add inputs to calculate payment.';
  }

  // Renders payment, taxes and selected cadence (monthly/biweekly/weekly).
  renderPayment(pricing, paymentEl, basePaymentEl, taxEl1, taxEl2, paymentHintEl) {
    const missingRequiredFields = this.getMissingRequiredPaymentInputs(pricing);
    const hasRequiredInputs = missingRequiredFields.length === 0;
    this.setPaymentHint(paymentHintEl, missingRequiredFields);

    if (!hasRequiredInputs) {
      this.clearPaymentOutputs(paymentEl, basePaymentEl, taxEl1, taxEl2);
      return;
    }

    const payments = this.calcPayment(pricing, this.moneyFactor);
    const paymentKey = pricing.paymentFrequency?.toLowerCase();
    const selectedPayment = payments[paymentKey] ?? 0;

    const pst = selectedPayment * (payments.tax1 / 100);
    const gstHst = selectedPayment * (payments.tax2 / 100);
    const paymentTaxed = selectedPayment + pst + gstHst;

    basePaymentEl.value = Calculation.roundToTwo(selectedPayment);
    taxEl1.value = pst ? Calculation.roundToTwo(pst) : '';
    taxEl2.value = gstHst ? Calculation.roundToTwo(gstHst) : '';
    paymentEl.textContent = `${Calculation.roundToTwo(paymentTaxed).toLocaleString()}/${paymentKey || 'monthly'}`;
  }

  updateTotals(pricing, elements) {
    const terms = Calculation.toNumber(pricing.terms);
    const annualKm = Calculation.toNumber(pricing.annualKm);
    const paymentsPerYear = this.paymentFrequency[pricing.paymentFrequency] ?? 0;

    elements.numberOfPayments.value = terms > 0 ? (terms / 12) * paymentsPerYear : '';
    elements.totalKms.value = terms > 0 && annualKm > 0 ? `${((terms / 12) * annualKm).toLocaleString()}KM` : '';
  }

  updateDerivedFields(pricing, elements) {
    // Keep UI field updates declarative: each output maps to one resolver.
    const fieldMappers = {
      capSubtotal: () => this.calcSubtotal(pricing),
      taxCap: () => this.calcCapTax(pricing),
      capCost: () => this.calcCapCost(pricing),
      totalReduction: () => this.calcCapReduction(pricing),
      netLease: () => this.calcNetLease(pricing),
      residualAmount: () => this.calcResidual(pricing),
      adjustedResidual: () => this.calcAdjustedResidual(pricing),
      buyOption: () => this.calcAdjustedResidual(pricing),
      basePrice: () => this.isANumberFormat(pricing.base, pricing.option),
      sellingPrice: () => this.isANumberFormat(pricing.base, pricing.option),
    };

    Object.entries(fieldMappers).forEach(([elementKey, resolver]) => {
      elements[elementKey].value = resolver();
    });

    this.updateTotals(pricing, elements);
    this.renderPayment(pricing, elements.payment, elements.basePayment, elements.pst2, elements.gstHst2, elements.paymentHint);
  }

  calculate(elements) {
    // Maps pricing object keys to corresponding input/select class names.
    const objectData = {
      base: 'msrp',
      option: 'make_options',
      freight: 'freight',
      priorLease: 'prior_lease',
      accessories: 'accessories',
      insureProtect: 'insurance_protection',
      otherFees: 'other_fees',
      taxCap1: 'taxes_1',
      rebates: 'rebates',
      discount: 'discount',
      cashDown: 'cash_down',
      tradeAllowance: 'trade_allowance',
      lien: 'lien',
      residualMsrp: 'residual_msrp',
      residualRate: 'residual_rate',
      annualKm: 'annual_km',
      mileageCharges: 'mileage_charges',
      rate: 'rate',
      terms: 'terms',
      paymentFrequency: 'payment_frequency',
      pst1: 'pst_1',
      gstHst1: 'gst_hst_1',
    };

    const pricing = {};
    this.pricingState = pricing;

    // A single unified listener keeps all derived UI values in sync.
    const onValueChange = e => {
      for (const [key, className] of Object.entries(objectData)) {
        if (e.target.matches(`.${className}`)) {
          pricing[key] = e.target.value;
          break;
        }
      }

      this.updateDerivedFields(pricing, elements);
    };

    this.prices.forEach(el => {
      el.addEventListener('input', onValueChange);
      el.addEventListener('change', onValueChange);
    });

    // Clears every field in-place without a full page reload.
    elements.resetBtn.addEventListener('click', () => {
      Object.keys(pricing).forEach(key => {
        delete pricing[key];
      });

      this.prices.forEach(field => {
        field.classList.remove('not-a-number', 'reset-not-a-number');

        if (field.matches('select')) {
          if (field.matches('.annual_km')) {
            field.innerHTML = '<option value="">Choose...</option>';
          }
          field.selectedIndex = 0;
          return;
        }

        field.value = '';
      });

      this.clearPaymentOutputs(elements.payment, elements.basePayment, elements.pst2, elements.gstHst2, '');
      this.setPaymentHint(elements.paymentHint, this.getMissingRequiredPaymentInputs(pricing));
    });
  }
}

export default Calculation;
