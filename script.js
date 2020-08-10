const addButton = document.getElementById('addButton');
const applianceSelect = document.getElementsByClassName('applianceSelect')[0];

const panels = {
  victron30Wp: {
    wattage: 30,
    Imppt: 2,
    Voc: 12,
  },
  solar50Wp: {
    wattage: 50,
    Imppt: 3,
    Voc: 12,
  },
  victron115Wp: {
    wattage: 115,
    Imppt: 8,
    Voc: 18,
  },
  victron175Wp: {
    wattage: 175,
    Imppt: 9,
    Voc: 22,
  },
  amerisolar285Wp: {
    wattage: 285,
    Imppt: 9.5,
    Voc: 31,
  },
  qcells350Wp: {
    wattage: 350,
    Imppt: 11,
    Voc: 32,
  },
};

const appliances = {
  kettle: 1200,
  phone: 15,
  čerpadlo: 500,
};

for (const appliance in appliances) {
  if (appliances.hasOwnProperty(appliance)) {
    const option = new Option(`${appliance[0].toUpperCase()}${appliance.slice(1)}`, appliance);
    applianceSelect.add(option);
  }
}

const checkForNegativeValues = () => {
  const numberInputs = document.querySelectorAll('input[type="number"]');

  for (const input of numberInputs) {
    input.addEventListener('input', (event) => {
      if (parseInt(event.target.value) < 0) {
        event.target.value = 0;
      }
    });
  }
};

checkForNegativeValues();

const updateTotalConsumptionFields = (stage) => {
  const whPerDayTotalField = document.getElementById('whPerDayTotal');
  const whPerDayRequiredField = document.getElementById('whPerDayRequired');
  const whPerMonthField = document.getElementById('kwhPerMonth');

  if (stage === 'applianceStage') {
    const consumptionFields = [...document.getElementsByClassName('consumption')];
    const consumptionValues = consumptionFields.slice(1).map((field) => parseInt(field.value));
    whPerDayTotalField.value = consumptionValues.reduce((a, b) => {
      return a + b;
    }, 0);
  }

  const requiredWh = Math.ceil(Math.ceil(whPerDayTotalField.value) * 1.3);
  whPerDayRequiredField.innerHTML = `${requiredWh} Wh`;
  whPerMonthField.value = ((requiredWh / 1000) * 31).toFixed(2);
};

const deleteRow = (button) => {
  button.closest('.originalRow').remove();
  updateTotalConsumptionFields('applianceStage');
};

const updateFields = (inputFields) => {
  const appliance = event.target.value;

  inputFields.quantity.value = 1;
  if (appliance) {
    inputFields.power.value = appliances[appliance];
  } else {
    inputFields.power.value = 0;
  }

  inputFields.usage.value = 1;
  inputFields.consumption.value =
    inputFields.power.value * inputFields.quantity.value * inputFields.usage.value;
  updateTotalConsumptionFields('applianceStage');
};

const addRow = () => {
  const parent = document.getElementById('appliances');
  const firstRow = document.getElementsByClassName('originalRow')[0];
  const clonedRow = firstRow.cloneNode(true);

  clonedRow.classList.replace('d-none', 'd-flex');

  parent.insertBefore(clonedRow, addButton);

  const select = clonedRow.querySelector('.applianceSelect');

  const quantityField = clonedRow.querySelector('.quantity');
  const powerField = clonedRow.querySelector('.power');
  const usageField = clonedRow.querySelector('.usage');
  const consumptionField = clonedRow.querySelector('.consumption');

  const fields = {
    quantity: quantityField,
    power: powerField,
    usage: usageField,
    consumption: consumptionField,
  };

  select.addEventListener('input', updateFields.bind(this, fields));

  usageField.addEventListener('input', (event) => {
    if (event.target.value > 24) {
      event.target.value = 24;
    }
  });

  for (const field in fields) {
    if (fields.hasOwnProperty(field)) {
      fields[field].addEventListener('change', (event) => {
        if (event.target !== consumptionField) {
          consumptionField.value = powerField.value * quantityField.value * usageField.value;
        }
        updateTotalConsumptionFields('applianceStage');
      });
      fields[field].value = 0;
    }
  }

  checkForNegativeValues();

  const removeButtons = [...document.getElementsByClassName('removeButton')];

  for (const removeButton of removeButtons.slice(2)) {
    removeButton.disabled = false;
    removeButton.classList.replace('btn-danger', 'btn-outline-danger');
    removeButton.addEventListener('click', deleteRow.bind(this, removeButton));
  }
};

addRow();

addButton.addEventListener('click', addRow);

const angleRange = document.getElementById('angleRange');

angleRange.addEventListener('input', (event) => {
  const angleOutput = document.getElementById('angleOutput');
  angleOutput.innerHTML = `${event.target.value}°`;
});

const whPerDayTotalField = document.getElementById('whPerDayTotal');

whPerDayTotalField.addEventListener('change', (event) => {
  updateTotalConsumptionFields('consumptionStage');
});

const getLatLong = (address) => {
  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: address }, (results, status) => {
      if (status == google.maps.GeocoderStatus.OK) {
        const latitude = results[0].geometry.location.lat();
        const longitude = results[0].geometry.location.lng();
        resolve([latitude, longitude]);
      }
    });
  });
};

const findNearestWattage = (requiredWattage) => {
  let closest;
  let morePanelsRequired = false;

  for (const panel in panels) {
    if (panels.hasOwnProperty(panel)) {
      const element = panels[panel];
      const difference = element.wattage - requiredWattage;

      if (requiredWattage <= 350) {
        morePanelsRequired = false;
        if (difference >= 0) {
          closest = element;
          break;
        }
      } else {
        morePanelsRequired = true;
        break;
      }
    }
  }
  if (morePanelsRequired) {
    const nOf285Panels = Math.ceil(requiredWattage / 285);
    const nOf350Panels = Math.ceil(requiredWattage / 350);

    return nOf285Panels <= nOf350Panels
      ? { panel: panels.amerisolar285Wp, quantity: nOf285Panels }
      : { panel: panels.qcells350Wp, quantity: nOf350Panels };
  } else {
    return {
      panel: closest,
      quantity: 1,
    };
  }
};

const calculateBatteryParameters = (panelConf, weekUsage, dailyConsumption) => {
  const voltage = panelConf.quantity < 2 ? 12 : 24;
  const capacity =
    weekUsage === 'week'
      ? Math.ceil((dailyConsumption * 2) / voltage)
      : Math.ceil((dailyConsumption * 4) / voltage);

  console.log(capacity);

  return capacity / panelConf.panel.Imppt >= 10
    ? { capacity: capacity, voltage: voltage }
    : { capacity: panelConf.panel.Imppt * 10, voltage: voltage };
};

const calculateButton = document.getElementById('calculateButton');

calculateButton.addEventListener('click', (event) => {
  const location = document.getElementById('location');
  const panelOrientation = document.getElementById('orientation').value;
  const panelAngle = document.getElementById('angleRange').value;

  if (location.value) {
    if (location.classList.contains('is-invalid')) {
      location.classList.remove('is-invalid');
    }

    const spinner = document.getElementById('spinner');
    spinner.classList.remove('d-none');

    const country = document.getElementById('countrySelect').value;

    getLatLong(`${location.value}, ${country}`).then((geolocation) => {
      fetch(`
            https://cors-anywhere.herokuapp.com/https://re.jrc.ec.europa.eu/api/PVcalc?outputformat=json&loss=14&peakpower=1&lat=${geolocation[0]}&lon=${geolocation[1]}&angle=${panelAngle}&aspect=${panelOrientation}`)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          const minimumSystemSize = document.getElementById('minimumSystemSize');
          const numberOfPanels = document.getElementById('numberOfPanels');
          const panelWattage = document.getElementById('panelWattage');
          const batteryCapacity = document.getElementById('batteryCapacity');
          const batteryVoltage = document.getElementById('batteryVoltage');

          const weekUsage = document.querySelector('input[name="weekUsage"]:checked').value;
          const yearUsage = document.querySelector('input[name="yearUsage"]:checked').value;

          const whPerDayRequired = parseInt(
            document.getElementById('whPerDayRequired').textContent
          );
          const kwhPerMonth = document.getElementById('kwhPerMonth').value;

          let systemSize;

          const month = yearUsage === 'winter' ? 0 : 8;

          systemSize = Math.ceil((kwhPerMonth / data.outputs.monthly.fixed[month].E_m) * 1000);

          if (weekUsage === 'weekend') {
            systemSize = Math.ceil((systemSize /= 3));
          }

          const panelConfiguration = findNearestWattage(systemSize);

          const onePanelWattage = panelConfiguration.panel.wattage;
          const nOfPanles = panelConfiguration.quantity;

          const batteryConfiguration = calculateBatteryParameters(
            panelConfiguration,
            weekUsage,
            whPerDayRequired
          );

          minimumSystemSize.innerHTML = `${systemSize} Wp`;

          panelWattage.innerHTML = `${onePanelWattage} Wp `;
          numberOfPanels.innerHTML = `${nOfPanles}ks`;

          batteryCapacity.innerHTML = `${batteryConfiguration.capacity} Ah `;
          batteryVoltage.innerHTML = `${batteryConfiguration.voltage}V`;

          const resultsArea = document.getElementById('results');

          spinner.classList.add('d-none');

          resultsArea.classList.remove('d-none');
        });
    });
  } else {
    location.classList.add('is-invalid');
  }
});
