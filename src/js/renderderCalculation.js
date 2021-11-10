class Calculation {
  constructor(prices, moneyFactor, points, paymentFrequency) {
    this.prices = prices;
    this.moneyFactor = moneyFactor;
    this.points = points;
    this.paymentFrequency = paymentFrequency;
  }

  isANumberFormat(...pricing) {
    const total = pricing.filter(v => Boolean(v)).reduce((acc, cur) => +acc + +cur, 0);
    return !isNaN(parseFloat(total)) && isFinite(total) ? (+total).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') : '';
  }

  getPricingAmount() {
    return;
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
    const tax = +this.calcSubtotal(price).replace(/[^0-9.-]+/g, '') * (+price.taxCap1 / 100);
    return this.isANumberFormat(tax);
  }

  calcCapCost(price) {
    const capCost = +this.calcSubtotal(price).replace(/[^0-9.-]+/g, '');
    const taxes = parseFloat(this.calcCapTax(price).replace(/[^0-9.-]+/g, ''));
    return this.isANumberFormat(capCost + taxes);
  }

  calcCapReduction(price) {
    return this.isANumberFormat(price.rebates, price.discount, price.cashDown, price.tradeAllowance, price.lien);
  }

  calcNetLease(price) {
    const capC = +this.calcCapCost(price).replace(/[^0-9.-]+/g, '');
    const capR = +this.calcCapReduction(price).replace(/[^0-9.-]+/g, '');
    return this.isANumberFormat(capC ? capC - capR : '');
  }

  calcResidual(price) {
    return this.isANumberFormat(+price.residualRate ? +price.residualMsrp * (+price.residualRate / 100) : '');
  }

  calcAjustedResidual(price) {
    const residual = +this.calcResidual(price).replace(/[^0-9.-]+/g, '');
    const mlCharges = +price.mileageCharges ? +price.mileageCharges : 0;
    return this.isANumberFormat(residual ? residual + mlCharges : '');
  }

  calcPayment(price, mF) {
    const residual = this.calcAjustedResidual(price).replace(/[^0-9.-]+/g, '');
    const netLease = this.calcNetLease(price).replace(/[^0-9.-]+/g, '');
    const depreciation = Number(netLease - residual);
    const monthlyBasePMT = depreciation / +price.terms;
    const moneyFactorValue = (+residual + +netLease) * ((!isNaN(parseFloat(price.rate)) && isFinite(price.rate) ? +price.rate : 0) / mF);
    const basePmt = monthlyBasePMT + moneyFactorValue;
    const tax1 = !isNaN(parseFloat(price.pst1)) ? price.pst1 : 0;
    const tax2 = !isNaN(parseFloat(price.gsthst1)) ? price.gsthst1 : 0;
    const monthly = !isNaN(parseFloat(basePmt)) ? basePmt : 0;
    const biweekly = !isNaN(parseFloat(basePmt)) ? (monthly * 12) / 26 : 0;
    const weekly = !isNaN(parseFloat(basePmt)) ? (monthly * 12) / 52 : 0;

    return { monthly, biweekly, weekly, basePmt, tax1, tax2 };
  }

  renderPayment(pricing, moneyfactor, paymentEl, basePaymentEL, taxEl1, taxEl2) {
    const payments = this.calcPayment(pricing, moneyfactor);
    Object.entries(payments).forEach(([pF, pmt]) => {
      if (pF === pricing.paymentFrequency?.toLowerCase() ?? '') {
        const pst = !isNaN(parseFloat(pmt)) ? pmt * (payments.tax1 / 100) : 0;
        const pstHst = !isNaN(parseFloat(pmt)) ? pmt * (payments.tax2 / 100) : 0;
        const paymentTaxed = pmt + pst + pstHst;

        // render tax (if any) + payments
        basePaymentEL.value = roundOff(pmt);
        taxEl1.value = pst ? roundOff(pst) : '';
        taxEl2.value = pstHst ? roundOff(pstHst) : '';
        paymentEl.textContent = `${roundOff(paymentTaxed).toLocaleString(undefined, {})}/${pF.toLowerCase()}`;

        function roundOff(num) {
          return +(Math.round(num + 'e+2') + 'e-2');
        }
      }
    });
  }

  calculate(elements) {
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
      gsthst1: 'gst_hst_1',
    };

    const functObject = {
      basePrice: 'isANumberFormat',
      sellingPrice: 'isANumberFormat',
      capSubtotal: 'calcSubtotal',
      taxCap: 'calcCapTax',
      capCost: 'calcCapCost',
      totalReduction: 'calcCapReduction',
      netLease: 'calcNetLease',
      residualAmount: 'calcResidual',
      adustedResidual: 'calcAjustedResidual',
      buyOption: 'calcAjustedResidual',
    };
    const pricing = {};
    const paymentFrequency = this.paymentFrequency;
    const moneyFactor = this.moneyFactor;

    this.prices.forEach(el => {
      el.addEventListener('input', function (e) {
        for (const [key, val] of Object.entries(objectData)) {
          if (e.target.matches(`.${val}`)) {
            pricing[key] = e.target.value;
          }
        }

        for (const [el, func] of Object.entries(functObject)) {
          if (el === 'basePrice' || el === 'sellingPrice') {
            elements[el].value = new Calculation().isANumberFormat(pricing.base, pricing.option);
          } else {
            elements[el].value = new Calculation()[func](pricing);
          }
        }

        //renderPayment
        new Calculation().renderPayment(pricing, moneyFactor, elements.payment, elements.basePayment, elements.pst2, elements.gsthst2);

        if (e.target.matches('.terms,.payment_frequency,.annual_km')) {
          el.addEventListener('change', function (e) {
            const terms = +pricing.terms;
            const pmtFreq = pricing.paymentFrequency;
            const km = pricing.annualKm?.replace(/[^0-9.-]+/g, '') ?? '';
            const kmYr = !isNaN(parseFloat(terms)) && isFinite(terms) ? (terms / 12) * +km : '';

            //reset numberOfPayments
            elements.numberOfPayments.value = '';

            Object.entries(paymentFrequency).forEach(([pF, num]) => {
              if (pF === pmtFreq) elements.numberOfPayments.value = (terms / 12) * num;
            });

            //renderPayment total KMs
            elements.totalKms.value = kmYr ? kmYr.toLocaleString(undefined, {}) + 'KM' : '';

            //renderPayment
            new Calculation().renderPayment(pricing, moneyFactor, elements.payment, elements.basePayment, elements.pst2, elements.gsthst2);
          });
        }
      });
    });

    // reload
    const allInputs = this.prices;
    elements.resetBtn.addEventListener('click', function (e) {
      window.location.reload();
      /**If Needs to just clear input fields */
      /*
      allInputs.forEach(el => {
        if (el.matches('input:read-only')) {
          el.value = '0.00';
        } else if (el.matches('select')) {
          el.selectedIndex = 0;
        } else {
          el.value = '';
        }
      });
      document.querySelector('.payment').textContent = '0.00';
      */
    });
  }
}

export default Calculation;
