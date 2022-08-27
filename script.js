//Appliance specs

//pair -> name : power [W]

const appliances = {
  'mixér': 500,
  'kávovar': 1000,
  'umývačka riadu': 1500,
  'chladnička - menšia': 60,
  'chladnička - väčšia': 150,
  'kanvica': 1200,
  'mikrovlná rúra - moderná': 1000,
  'mikrovlná rúra - staršia': 2400,
  'rúra': 1200,
  'toaster': 850,
  'centrálna klimatizácia': 3500,
  'ventilátor': 100,
  'elektrický ohrievač': 2000,
  'bojler': 3000,
  'čerpadlo - menšie': 300,
  'čerpadlo - väčšie': 700,
  'sušička': 3000,
  'práčka': 1000,
  'žehlička': 1200,
  'žiarovka 40W - klasická': 40,
  'žiarovka 60W - klasická': 60,
  'žiarovka 100W - klasická': 100,
  'LED žiarovka - 40W ekvivalent': 10,
  'LED žiarovka - 60W ekvivalent': 13,
  'LED žiarovka - 100W ekvivalent': 23,
  'CFL žiarovka - 40W ekvivalent': 11,
  'CFL žiarovka - 60W ekvivalent': 18,
  'CFL žiarovka - 100W ekvivalent': 30,
  'televízor - plazma': 200,
  'televízor - LCD': 150,
  'televízor - LED': 100,
  'TV prijímač': 25,
  'herná konzola': 150,
  'laptop - klasický': 60,
  'laptop - herný': 150,
  'mobilný telefón - klasický': 18,
  'mobilný telefón - výkonný': 30,
};

//Loading DOM elements (used multiple times)

const addButton = document.getElementById('addButton');
const applianceSelect = document.getElementsByClassName('applianceSelect')[0];

const whPerDayTotalField = document.getElementById('whPerDayTotal');
const whPerDayRequiredField = document.getElementById('whPerDayRequired');
const kwhPerMonthField = document.getElementById('kwhPerMonth');
const angleRange = document.getElementById('angleRange');
const calculateButton = document.getElementById('calculateButton');

// UI and input-handling part

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
  if (stage === 'applianceStage') {
    const consumptionFields = [...document.getElementsByClassName('consumption')];
    const consumptionValues = consumptionFields.slice(1).map((field) => parseInt(field.value));
    whPerDayTotalField.value = consumptionValues.reduce((a, b) => {
      return a + b;
    }, 0);
  } else if (stage === 'monthlyConsumptionStage') {
    whPerDayTotalField.value = Math.ceil((parseFloat(kwhPerMonthField.value) * 1000) / 31 / 1.1);
    const requiredWh = Math.ceil(Math.ceil(whPerDayTotalField.value) * 1.1);
    whPerDayRequiredField.innerHTML = `${requiredWh} Wh`;
    return;
  }

  const requiredWh = Math.ceil(Math.ceil(whPerDayTotalField.value) * 1.1);
  whPerDayRequiredField.innerHTML = `${requiredWh} Wh`;
  kwhPerMonthField.value = ((requiredWh / 1000) * 31).toFixed(2);
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

  if (appliance.includes('chladnička')) {
    inputFields.usage.value = 8;
  } else {
    inputFields.usage.value = 1;
  }

  inputFields.consumption.value = (
    parseFloat(inputFields.power.value) *
    parseFloat(inputFields.quantity.value) *
    parseFloat(inputFields.usage.value)
  ).toFixed(2);
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
          consumptionField.value = (
            parseFloat(powerField.value) *
            parseFloat(quantityField.value) *
            parseFloat(usageField.value)
          ).toFixed(2);
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

angleRange.addEventListener('input', (event) => {
  const angleOutput = document.getElementById('angleOutput');
  angleOutput.innerHTML = `${event.target.value}°`;
});

whPerDayTotalField.addEventListener('input', (event) => {
  updateTotalConsumptionFields('dailyConsumptionStage');
});

kwhPerMonthField.addEventListener('input', (event) => {
  updateTotalConsumptionFields('monthlyConsumptionStage');
});

//Calculation part

const calculateBatteryParameters = (requiredPVPower, weekUsage, dailyConsumption) => {
  const LEAD_ACID_DOD_FACTOR = 2.0;
  const LEAD_ACID_INEFFICIENCY = 1.2;

  const LITHIUM_DOD_FACTOR = 1.2;
  const LITHIUM_INEFFICIENCY = 1.05;

  let voltage, batteryType;

  if (requiredPVPower <= 400) {
    voltage = 12;
    batteryType = 'lead-acid';
  } else if (requiredPVPower > 400 && requiredPVPower <= 1200) {
    voltage = 24;
    batteryType = 'lead-acid';
  } else if (requiredPVPower > 1200) {
    voltage = 48;
    batteryType = 'lithium';
  }

  let capacity;

  //calculate capacity with 1 day reserve
  capacity =
    batteryType === 'lead-acid'
      ? Math.ceil((dailyConsumption * LEAD_ACID_DOD_FACTOR * LEAD_ACID_INEFFICIENCY) / voltage)
      : Math.ceil((dailyConsumption * LITHIUM_DOD_FACTOR * LITHIUM_INEFFICIENCY) / voltage);

  // capacity = weekUsage === 'week' ? capacity : capacity * 2;

  return { capacity: capacity, voltage: voltage };
};

calculateButton.addEventListener('click', (event) => {
  const panelOrientation = document.getElementById('orientation').value;
  const panelAngle = parseInt(angleRange.value);
  const geolocation = ['48.782', '18.591']; //jesenskeho 35, bojnice

  const spinner = document.getElementById('spinner');

  const corsUrl = 'https://cors-anywhere.herokuapp.com/';
  const jrcApiUrl = 'https://re.jrc.ec.europa.eu/api/v5_2/PVcalc';
  const apiParameters = `?outputformat=json&loss=14&peakpower=1&lat=${geolocation[0]}&lon=${geolocation[1]}&angle=${panelAngle}&aspect=${panelOrientation}`;

  if (whPerDayTotalField.value !== '0') {
    if (whPerDayTotalField.classList.contains('is-invalid')) {
      whPerDayTotalField.classList.remove('is-invalid');
    }
    
    spinner.classList.remove('d-none');
    fetch(corsUrl + jrcApiUrl + apiParameters)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const minimumSystemSize = document.getElementById('minimumSystemSize');
        const batteryCapacity = document.getElementById('batteryCapacity');
        const batteryVoltage = document.getElementById('batteryVoltage');

        const weekUsage = document.querySelector('input[name="weekUsage"]:checked').value;
        const yearUsage = document.querySelector('input[name="yearUsage"]:checked').value;

        const whPerDayRequired = parseInt(whPerDayRequiredField.textContent);
        const kwhPerMonth = parseFloat(kwhPerMonthField.value);

        let systemSize;

        const month = yearUsage === 'winter' ? 11 : 9;

        systemSize = Math.ceil((kwhPerMonth / data.outputs.monthly.fixed[month].E_m) * 1000);

        if (weekUsage === 'weekend') {
          systemSize = Math.ceil((systemSize /= 3));
        }

        const batteryConfiguration = calculateBatteryParameters(
          systemSize,
          weekUsage,
          whPerDayRequired
        );

        minimumSystemSize.innerHTML = `${systemSize} Wp`;

        batteryCapacity.innerHTML = `${batteryConfiguration.capacity} Ah `;
        batteryVoltage.innerHTML = `${batteryConfiguration.voltage}V`;

        spinner.classList.add('d-none');

        const resultsArea = document.getElementById('results');
        resultsArea.classList.remove('d-none');
      });
  } else {
    whPerDayTotalField.classList.add('is-invalid');
  }
});
