var activeShift = loadBoolean("activeShift") || false;
let cellSize = JSON.parse(localStorage.getItem("cellSize")) || 125;
var categories = JSON.parse(localStorage.getItem("categories")) || [];
var products = JSON.parse(localStorage.getItem("products")) || [];
var tables = [];
var sales = [];
var shifts = JSON.parse(localStorage.getItem("shifts")) || [];
var barName = JSON.parse(localStorage.getItem("barName")) || "Bar name";
var paymentsMethods = [];
var cashRegisters = [];
var selectedTable = null;
var visibleInput = null;
var shiftStartTime = null;
var shiftStartDate = null;
var total = 0;

const grid = document.querySelector(".grid");
const renameGroupDialog = document.querySelector(".changeNameDialog");
const shiftCover = document.querySelector(".shifCover");

function createCategory() {
  const input = document.querySelector("#categoryNameInput");
  const newCategory = input.value;
  categories.push(newCategory);
  saveData("categories", categories);

  input.value = "";
  closeCurrentDialog();
  switchDialogState("cartaDialog");
  fillCategoryOptions();
}

function fillCategoryOptions() {
  const categorySelect = document.getElementById("productCategory");
  categorySelect.innerHTML = "";
  categories.forEach(function (category) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

fillCategoryOptions();

function createProduct(editProd) {
  const name = document.getElementById("productName").value;
  const price = parseFloat(
    document.getElementById("productPrice").value.replace(",", ".")
  );
  const cost = parseFloat(
    document.getElementById("productCost").value.replace(",", ".")
  );
  const printCommand = document.getElementById("ch1").checked;
  const addToSummary = document.getElementById("ch2").checked;
  var category = document.getElementById("productCategory").value;

  // Validación básica
  if (!name || isNaN(price) || isNaN(cost)) {
    alert("Por favor, complete todos los campos correctamente.");
    return;
  }

  if (!category) {
    category = null;
  }

  const product = {
    name: name,
    price: price,
    cost: cost,
    printCommand: printCommand,
    addToSummary: addToSummary,
    category: category,
  };

  products.push(product);
  saveData("products", products);

  // Limpiar campos y cerrar el formulario
  document.getElementById("productName").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productCost").value = "";
  document.getElementById("ch1").checked = false;
  document.getElementById("ch2").checked = false;
  document.getElementById("productCategory").selectedIndex = 0;

  closeCurrentDialog();
  switchDialogState("cartaDialog");
}

displayCategories();

function displayCategories() {
  const catList = document.querySelector("#catList");
  const prodList = document.querySelector("#menuList");

  categories.forEach((c, index) => {
    const categoryBtn = document.createElement("button");
    categoryBtn.textContent = c;
    catList.appendChild(categoryBtn);

    categoryBtn.addEventListener("click", function () {
      prodList.innerHTML = "";
      const filteredProducts = products.filter((p) => p.category === c);
      filteredProducts.forEach((p) => {
        const prod = document.createElement("div");
        prod.innerHTML = `
        <span class="spanName">${p.name}</span>
        <span class="wfull">$${p.price}</span>
        <i class="material-icons">more_vert</i>
        `;
        prodList.appendChild(prod);
      });
    });

    if (index === 0) {
      categoryBtn.click();
    }
  });
}

document.querySelector("#startShift").addEventListener("click", function () {
  activeShift = true;
  shiftStartTime = getFormatedTime();
  shiftStartDate = getFormatedDate();
  shiftManagment();
});

document.querySelector("#closeShitBtn").addEventListener("click", function () {
  var occupiedTables = 0;
  tables.forEach((t) => {
    if (t.products.length) {
      occupiedTables++;
    }
  });
  if (occupiedTables > 0) {
    document.querySelector(
      "#advert1"
    ).textContent = `${occupiedTables} mesas sin cerrar`;
  } else {
    createShift();
    activeShift = false;
    sales = [];
    total = 0;
    cashRegisters.forEach((cr) => {
      cr.total = 0;
    });
    closeCurrentDialog();
    saveData("cashRegisters", cashRegisters);
    saveData("sales", sales);
    shiftManagment();
  }
});

function createShift() {
  const newShift = {
    date: shiftStartDate,
    startTime: shiftStartTime,
    endTime: getFormatedTime(),
    sales: [...sales],
  };
  shifts.push(newShift);
  saveData("shifts", shifts);
}

function shiftManagment() {
  if (!activeShift) {
    shiftCover.classList.remove("hide");
  } else {
    shiftCover.classList.add("hide");
  }
  saveData("activeShift", activeShift);
}

function getTimeSpan(startTime) {
  const currentTime = Date.now();
  const timeSpan = (currentTime - startTime) / (1000 * 60);
  return `${timeSpan.toFixed(0)}m`;
}

document.querySelector("#addTable").addEventListener("click", function () {
  createNewTable();
});

var editMode = false;

function createNewTable() {
  const cells = document.querySelectorAll(".cell");
  for (const cell of cells) {
    if (!cell.querySelector(".table")) {
      const table = {
        id: Date.now(),
        name: `Mesa ${tables.length + 1}`,
        products: [],
        total: 0,
        waitingPayment: false,
        position: cell.id,
        shape: true,
        startTime: null,
      };
      tables.push(table);
      saveTablesToLocalStorage();
      printTable(cell.id, table);
      return;
    }
  }
}

function printTable(position, table) {
  const cell = document.getElementById(position);
  const newTable = document.createElement("div");
  newTable.classList.add("table");
  newTable.draggable = true;
  newTable.id = `table-${table.id}`;

  const tableText = document.createElement("span");
  tableText.classList.add("tableText");
  tableText.id = `tableText-${table.id}`;
  tableText.textContent = table.name;

  const tooltip = document.createElement("div");
  tooltip.classList.add("tooltip", "flex-col");

  const timeDiv = document.createElement("div");
  timeDiv.classList.add("flex", "gap-8");
  const timerIcon = document.createElement("i");
  timerIcon.classList.add("material-icons");
  timerIcon.textContent = "timer";
  const timeSpan = document.createElement("span");
  timeSpan.textContent = "0m";
  timeSpan.id = `timeSpan-${table.id}`;

  timeDiv.appendChild(timerIcon);
  timeDiv.appendChild(timeSpan);
  tooltip.appendChild(timeDiv);

  newTable.appendChild(tableText);
  newTable.appendChild(tooltip);

  newTable.addEventListener("dragstart", dragStart);
  newTable.addEventListener("dragend", dragEnd);
  newTable.addEventListener("click", function () {
    if (selectedTable) {
      document
        .getElementById(`table-${selectedTable.id}`)
        .classList.remove("tableSelected");
    }
    selectedTable = table;
    newTable.classList.add("tableSelected");
    updateTableState();
  });

  cell.appendChild(newTable);

  if (!table.shape) {
    newTable.classList.add("circleTable");
  }
}

function dragStart(event) {
  if (editMode) {
    event.dataTransfer.setData("text/plain", event.target.id);
  }
}

function dragEnd(event) {}

function allowDrop(event) {
  event.preventDefault();
}

function drop(event) {
  event.preventDefault();
  const tableId = event.dataTransfer.getData("text/plain");
  const tableUI = document.getElementById(tableId);
  const table = tables.find((t) => t.id == tableId.replace("table-", ""));
  if (
    event.target.classList.contains("cell") &&
    !event.target.querySelector(".table")
  ) {
    event.target.appendChild(tableUI);
    table.position = event.target.id;
    saveTablesToLocalStorage();
  }
}

const decrementPx = document.getElementById("decrementPx");
const incrementPx = document.getElementById("incrementPx");
const pxValue = document.getElementById("pxValue");

pxValue.textContent = cellSize;

decrementPx.addEventListener("click", () => handlePxChange(-25));
incrementPx.addEventListener("click", () => handlePxChange(25));

function handlePxChange(change) {
  updatePxValue(pxValue, change);
}

// Update the px value and save to local storage
function updatePxValue(span, change) {
  let newValue = parseInt(span.textContent, 10) + change;
  newValue = Math.max(0, Math.min(300, newValue));
  span.textContent = newValue;
  cellSize = newValue;
  generateGrid();
  saveData("cellSize", cellSize);
}

function generateGrid() {
  const pxSize = parseInt(cellSize, 10);
  grid.style.gridTemplateColumns = `repeat(20, ${pxSize}px)`;
  grid.style.gridTemplateRows = `repeat(20, ${pxSize}px)`;
}

generateGrid();

printCells();
function printCells() {
  var cellsNeeded = 20 * 20;
  for (let i = 0; i < cellsNeeded; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.id = i + 1;
    cell.addEventListener("dragover", allowDrop);
    cell.addEventListener("drop", drop);
    grid.appendChild(cell);
  }
}

const configTableBtn = document.querySelector("#tableConfig");
const configSalonBtn = document.querySelector("#salonConfig");

const panelPag1 = document.querySelector("#panelPag1");
const panelPag2 = document.querySelector("#panelPag2");

configTableBtn.addEventListener("click", function () {
  this.querySelector(".checked").classList.remove("hide");
  this.querySelector(".unchecked").classList.add("hide");

  configSalonBtn.querySelector(".checked").classList.add("hide");
  configSalonBtn.querySelector(".unchecked").classList.remove("hide");

  panelPag1.classList.remove("hide");
  panelPag2.classList.add("hide");
  grid.classList.remove("gridEditMode");
  editMode = false;
});

configSalonBtn.addEventListener("click", function () {
  // Mostrar Salon
  this.querySelector(".checked").classList.remove("hide");
  this.querySelector(".unchecked").classList.add("hide");

  configTableBtn.querySelector(".checked").classList.add("hide");
  configTableBtn.querySelector(".unchecked").classList.remove("hide");

  panelPag1.classList.add("hide");
  panelPag2.classList.remove("hide");
  grid.classList.add("gridEditMode");
  editMode = true;
});

function switchDialogState(dialogId) {
  const container = document.querySelector(".dialogContainer");
  const currentDialog = document.querySelector(".dialog:not(.hide)");
  const newDialog = document.getElementById(dialogId);

  if (newDialog) {
    if (currentDialog) {
      currentDialog.classList.add("hide");
    }
    container.classList.remove("hide");
    newDialog.classList.remove("hide");
  } else {
    alert("No se encontró el diálogo: " + dialogId);
  }
}

document.querySelector("#uploadFile").addEventListener("click", function () {
  closeCurrentDialog();
  switchDialogState("loadFileDialog");
});

function loadFileToLocalStorage() {
  const input = document.querySelector("#jsonInp");

  // Asegurarse de que el input tiene contenido
  if (input && input.value) {
    try {
      // Parsear el JSON ingresado en el input
      const products = JSON.parse(input.value);

      // Reemplazar el valor de 'products' en localStorage con el nuevo JSON
      localStorage.setItem("products", JSON.stringify(products));

      // Extraer todas las categorías únicas
      const categories = [
        ...new Set(products.map((product) => product.category)),
      ];

      // Guardar las categorías en localStorage
      localStorage.setItem("categories", JSON.stringify(categories));

      console.log("Productos y categorías actualizados en localStorage");
    } catch (error) {
      console.error("Error al parsear el JSON:", error);
    }
  } else {
    console.error("No hay contenido en el input");
  }
}

function closeCurrentDialog() {
  const currentDialog = document.querySelector(".dialog:not(.hide)");
  if (currentDialog) {
    currentDialog.classList.add("hide");
    const container = document.querySelector(".dialogContainer");
    if (!document.querySelector(".dialog:not(.hide)")) {
      container.classList.add("hide");
    }
  }
}

const tableShapeBtn = document
  .getElementById("tableShape")
  .addEventListener("click", function () {
    selectedTable.shape = !selectedTable.shape;
    updateTableShape();
  });

const deleteTableBtn = document.getElementById("delTable");
deleteTableBtn.addEventListener("click", function () {
  tables = tables.filter((t) => t.id !== selectedTable.id);
  document.getElementById(`table-${selectedTable.id}`).remove();
  saveTablesToLocalStorage();
  selectATable();
});

const tableTextInput = document.getElementById("tableTextInput");
tableTextInput.addEventListener("keyup", function (event) {
  if (event.key == "Enter") {
    selectedTable.name = tableTextInput.value;
    document.getElementById(`tableText-${selectedTable.id}`).textContent =
      tableTextInput.value;
    saveTablesToLocalStorage();
  }
});

const paymentsBtn = document.querySelector("#closeSell");
const printBtn = document.getElementById("printTicket");

printBtn.addEventListener("click", function () {
  if (selectedTable.products.length) {
    printTicket();
    selectedTable.waitingPayment = true;
    updateTableState();
  }
});

function updateTableState() {
  const tableUI = document.getElementById(`table-${selectedTable.id}`);
  const selectedTableName = document.getElementById("selectedTableName");
  const selectedProdListElement = document.getElementById("selectedTableList");
  const selectedTableTotalElement =
    document.getElementById("totalSelectedTable");
  const tooltip = document.getElementById(`timeSpan-${selectedTable.id}`);

  selectedProdListElement.innerHTML = "";
  if (!selectedTable.products.length) {
    tableUI.classList.remove("blueTable");
    tableUI.classList.remove("occupied");
    printBtn.classList.add("blocked");
    tooltip.textContent = "0m";
    selectedTable.startTime = null;
  } else {
    printItemsWithQuantity(
      "selectedTableList",
      selectedTable.products,
      (withTime = true)
    );
    tableUI.classList.add("occupied");
    printBtn.classList.remove("blocked");
    tooltip.textContent = getTimeSpan(selectedTable.startTime);
    if (selectedTable.waitingPayment) {
      tableUI.classList.remove("occupied");
      tableUI.classList.add("blueTable");
    }
  }
  document.getElementById("NotaContainer").textContent = selectedTable.note;
  selectedTableName.textContent = selectedTable.name;
  selectedTableTotalElement.textContent = `Total: $${selectedTable.total.toFixed(
    2
  )}`;
  saveTablesToLocalStorage();
}

function updateTableShape() {
  const tableUI = document.getElementById(`table-${selectedTable.id}`);
  if (selectedTable.shape) {
    tableUI.classList.remove("circleTable");
  } else {
    tableUI.classList.add("circleTable");
  }
  saveTablesToLocalStorage();
}

document
  .querySelector("#openSellwindow1")
  .addEventListener("click", function () {
    if (selectedTable) {
      switchDialogState("sellWindow");
      displaySellWindow(selectedTable);
    } else {
      alert("Seleccione una mesa.");
    }
  });

const groupsTabs = document.querySelector("#sellWindowPestaña");
const productList = document.querySelector("#sellWindowProductList");
const addedItems = document.querySelector("#addedItems");
const selectedTableUI = document.querySelector("#selectedTable");
const cancelBtn = document.querySelector("#cancelOperation");
const apply = document.querySelector("#addItems");
const totalUI = document.querySelector("#sellWindowTotal");
const variableText = document.querySelector("#variableText");
var itemsToAdd = [];
var tableSubTotal = 0;

function displaySellWindow() {
  groupsTabs.innerHTML = "";
  categories.forEach((c, index) => {
    const categoryBtn = document.createElement("button");
    categoryBtn.textContent = c;
    groupsTabs.appendChild(categoryBtn);
    categoryBtn.addEventListener("click", function () {
      productList.innerHTML = "";
      const filteredProducts = products.filter((p) => p.category === c);
      filteredProducts.forEach((p) => {
        const prod = document.createElement("button");
        prod.className = "squareProdBtn flex flex-col";
        prod.textContent = p.name;
        productList.appendChild(prod);
        prod.addEventListener("click", function () {
          itemsToAdd.push(p);
          tableSubTotal += parseFloat(p.price);
          totalUI.textContent = `Subtotal: $${tableSubTotal.toFixed(2)}`;
          printItemsWithQuantity("addedItems", itemsToAdd, false, true);
        });
      });
    });

    if (index === 0) {
      categoryBtn.click();
    }
  });

  if (selectedTable.position) {
    selectedTableUI.textContent = `${selectedTable.name}`;
    variableText.textContent = "Adicionar";
  } else {
    selectedTableUI.textContent = `Venta en mostrador`;
    variableText.textContent = "Vender";
  }
}

apply.addEventListener("click", mergeLists);

function addProductToTable(product) {
  const productToAdd = {
    name: product.name,
    price: product.price,
    additionTime: Date.now(),
  };
  selectedTable.products.push(productToAdd);
}

function mergeLists() {
  closeCurrentDialog();
  totalUI.textContent = "$0.00";
  addedItems.innerHTML = "";

  if (itemsToAdd.length) {
    itemsToAdd.forEach((item) => {
      addProductToTable(item);
    });
    itemsForComand = itemsToAdd.filter((p) => p.printCommand);
    selectedTable.total = selectedTable.total + tableSubTotal;
    if (selectedTable.position) {
      if (!selectedTable.startTime) {
        selectedTable.startTime = Date.now();
      }
      updateTableState();
    } else {
      switchDialogState("confirmSellDialog");
      printTicket();
    }
    if (itemsForComand.length) {
      printTicketComanda(itemsForComand);
    }
    tableSubTotal = 0;
    itemsToAdd = [];
  } else {
    cancelOperation();
  }
}

cancelBtn.addEventListener("click", cancelOperation);

function cancelOperation() {
  itemsToAdd = [];
  tableSubTotal = 0;
  totalUI.textContent = "$0.00";
  addedItems.innerHTML = "";
  if (!selectedTable.position) {
    selectATable();
  }
}

function printItemsWithQuantity(
  listElementID,
  listToPrint,
  withTime,
  withPrinteable
) {
  const listElement = document.getElementById(listElementID);
  listElement.innerHTML = "";

  const productCount = listToPrint.reduce((acc, product, index) => {
    const { name, price, additionTime } = product;
    if (!acc[name]) {
      acc[name] = { price, count: 0, indexes: [], additionTime };
    }
    acc[name].count++;
    acc[name].indexes.push(index);
    return acc;
  }, {});

  for (const [name, { price, count, indexes, additionTime }] of Object.entries(
    productCount
  )) {
    const listItem = document.createElement("div");
    listItem.classList.add("prodInPordList2");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `${name}`;
    nameSpan.classList.add("elipsis");

    const countSpan = document.createElement("span");
    countSpan.textContent = `x${count}`;

    const priceSpan = document.createElement("span");
    priceSpan.textContent = `$${(price * count).toFixed(2)}`;

    const delBtn = document.createElement("button");
    delBtn.innerHTML = '<i class="material-icons">delete</i>';
    delBtn.classList.add("discretBtn");

    delBtn.addEventListener("click", () => {
      const totalDeletedPrice = price * count;
      for (let i = indexes.length - 1; i >= 0; i--) {
        listToPrint.splice(indexes[i], 1);
      }
      printItemsWithQuantity(listElementID, listToPrint);
      if (tableSubTotal) {
        tableSubTotal = tableSubTotal - totalDeletedPrice;
        totalUI.textContent = `Subtotal: $${tableSubTotal.toFixed(2)}`;
      } else {
        selectedTable.total = selectedTable.total - totalDeletedPrice;
        updateTableState();
      }
    });

    listItem.appendChild(nameSpan);
    listItem.appendChild(countSpan);
    listItem.appendChild(priceSpan);
    if (withTime) {
      const additionTimeSpan = document.createElement("span");
      additionTimeSpan.textContent = getTimeSpan(additionTime);
      listItem.appendChild(additionTimeSpan);
    }
    if (withPrinteable) {
      const printItemBtn = document.createElement("button");
    }
    listItem.appendChild(delBtn);
    listElement.appendChild(listItem);
  }
}

document
  .querySelector("#cancleClosetableBtn")
  .addEventListener("click", function () {
    if (!selectedTable.position) {
      selectedTable.products = [];
      selectedTable.total = 0;
      selectATable();
    }
  });

function closeTable() {
  if (selectedTable.products.length > 0) {
    registerSale();
    selectedTable.products = [];
    selectedTable.total = 0;
    if (selectedTable.position) {
      selectedTable.waitingPayment = false;
      selectedTable.note = "";
      selectedTable.startTime = null;
      updateTableState();
    } else {
      selectATable();
    }
    calcInput.value = "";
    resultSpan.textContent = "";
    vueltoSpan.textContent = "";
  } else {
    alert("Mesa sin productos");
    closeCurrentDialog();
  }
}

function updateBalances() {
  total = 0;
  cashRegisters.forEach((cr) => (cr.total = 0));

  sales.forEach((s) => {
    total += s.total;

    if (s.products) {
      s.products.forEach((p) => {
        let crToUpdate = cashRegisters.find((cr) => p.cashRegister == cr.name);
        if (crToUpdate) {
          crToUpdate.total += parseFloat(p.price);
        }
      });
    }
  });

  document.querySelector("#totalabsoluto").textContent = `$${total.toFixed(2)}`;
  document.querySelector("#cajasList").innerHTML = "";

  cashRegisters.forEach((cr) => {
    printCashRegister(cr);
  });

  localStorage.setItem("cashRegisters", JSON.stringify(cashRegisters));
  localStorage.setItem("totalSales", total.toFixed(2));
}

function loadFromLocalStorage() {
  let storedCashRegisters = JSON.parse(localStorage.getItem("cashRegisters"));
  if (storedCashRegisters) {
    cashRegisters = storedCashRegisters;
  }

  let storedTotalSales = parseFloat(localStorage.getItem("totalSales"));
  if (!isNaN(storedTotalSales)) {
    total = storedTotalSales;
  }

  updateBalances();
}

function registerSale() {
  const saleData = {
    name: selectedTable.name,
    total: selectedTable.total,
    products: selectedTable.products,
    paymentsMethod: document.querySelector("#pmSlct").value,
    time: getFormatedTime(),
    date: getFormatedDate(),
    type: null,
  };
  if (selectedTable.position) {
    saleData.type = "table_restaurant";
  } else {
    saleData.type = "point_of_sale";
  }
  sales.push(saleData);
  printSale(saleData);
  saveData("sales", sales);
}

function printSale(sale) {
  const list = document.querySelector("#cashHistoryList");
  const movContainer = document.createElement("div");
  movContainer.className = "movContainer";

  const innerDiv = document.createElement("div");

  const movInfo = document.createElement("div");
  movInfo.className = "movInfo";

  const icon = document.createElement("i");
  icon.textContent = sale.type;
  icon.classList.add("material-icons");

  const mesaSpan = document.createElement("span");
  mesaSpan.textContent = sale.name;
  mesaSpan.classList.add("elipsis");

  const amountSpan = document.createElement("span");
  amountSpan.textContent = `$${sale.total.toFixed(2)}`;

  const dateSpan = document.createElement("span");
  dateSpan.textContent = sale.time;

  const dateSpan2 = document.createElement("span");
  dateSpan2.textContent = sale.date;

  const pmSpan = document.createElement("span");
  pmSpan.textContent = sale.paymentsMethod;
  pmSpan.classList.add("elipsis");

  movInfo.appendChild(icon);
  movInfo.appendChild(mesaSpan);
  movInfo.appendChild(amountSpan);
  movInfo.appendChild(dateSpan2);
  movInfo.appendChild(dateSpan);
  movInfo.appendChild(pmSpan);

  innerDiv.appendChild(movInfo);
  movContainer.appendChild(innerDiv);
  list.appendChild(movContainer);

  if (sale.products) {
    const button = document.createElement("button");
    button.className = "discretBtn";
    movInfo.appendChild(button);

    const icon = document.createElement("i");
    icon.className = "material-icons unchecked";
    icon.textContent = "chevron_left";

    const movListItem = document.createElement("div");
    movListItem.className = "movListItem hide";
    movListItem.id = `sale-${sale.id}`;
    movContainer.appendChild(movListItem);

    button.appendChild(icon);
    button.addEventListener("click", () => {
      movListItem.classList.toggle("hide");
      button.classList.toggle("rotate90");
    });
    printItemsWithQuantity(movListItem.id, sale.products);
  }
}

const noteInput = document.getElementById("noteInput");
noteInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    selectedTable.note = noteInput.value;
    updateTableState();
    hideInput();
    noteInput.value = "";
  }
});

var selectedProd = null;
const nameInput = document.getElementById("prodNameInput");
const priceInput = document.getElementById("prodPriceInput");
const availableCheckbox = document.getElementById("availableCb");
const printOncomandCheckbox = document.getElementById("printOnComand");
const cashRegistersSlct = document.getElementById("cajaForProdSlct");

function printItemData(product) {
  populateSelect("cajaForProdSlct", cashRegisters);
  selectedProd = product;
  nameInput.value = selectedProd.name;
  priceInput.value = selectedProd.price;
  availableCheckbox.checked = selectedProd.available;
  printOncomandCheckbox.checked = selectedProd.printOnComand;
  cashRegistersSlct.value = selectedProd.cashRegister;
}

function removeLS() {
  localStorage.removeItem("tables");
  localStorage.removeItem("groups");
}

function getFormatedTime() {
  const ahora = new Date();

  const horas = ahora.getHours().toString().padStart(2, "0");
  const minutos = ahora.getMinutes().toString().padStart(2, "0");

  return `${horas}:${minutos}`;
}

function getFormatedDate() {
  const newDate = new Date();
  const date = String(newDate.getDate()).padStart(2, "0");
  const month = String(newDate.getMonth() + 1).padStart(2, "0");
  const year = String(newDate.getFullYear()).slice(-2);

  return `${date}/${month}/${year}`;
}

var takeAwayTable = {
  name: "Venta de mostrador",
  products: [],
  total: 0,
};

document.querySelector("#vecBtn").addEventListener("click", function () {
  document
    .getElementById(`table-${selectedTable.id}`)
    .classList.remove("tableSelected");
  selectedTable = takeAwayTable;
  switchDialogState("sellWindow");
  displaySellWindow();
});

function selectATable() {
  if (tables.length > 0) {
    selectedTable = tables[0];
    document
      .getElementById(`table-${selectedTable.id}`)
      .classList.add("tableSelected");
    updateTableState();
  }
}

function printTicket() {
  // La lista de items está en selectedTable.products
  const products = selectedTable.products;

  // Crear un objeto para agrupar productos y calcular la cantidad
  const productCounts = {};

  // Recorrer la lista de productos para contar cuántas veces aparece cada producto
  products.forEach((product) => {
    if (productCounts[product.name]) {
      productCounts[product.name].quantity++;
    } else {
      productCounts[product.name] = {
        name: product.name,
        price: product.price,
        quantity: 1,
      };
    }
  });

  let itemsListHTML = "";

  // Iterar sobre los productos agrupados para construir el HTML dinámicamente
  Object.values(productCounts).forEach((product) => {
    itemsListHTML += `
      <div class="itemList">
        <span>${product.name}</span>
        <span>${product.quantity}</span>
        <span>$${(product.price * product.quantity).toFixed(2)}</span>
      </div>
    `;
  });

  // Calcular el total de los productos
  const total = Object.values(productCounts)
    .reduce((acc, product) => acc + product.price * product.quantity, 0)
    .toFixed(2);

  const ticketContent = `
  <body>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: monospace;
            font-size: 85%;
            color: var(--eerie-black);
        }
    
        .ticket {
            width: 420px;
        }
    
        span {
            font-size: 2rem;
        }
    
        h1 {
            text-align: center;
            font-size: 5rem;
        }
    
        h2 {
            text-align: center;
            font-size: 3rem;
        }
    
        .list {
            margin: 24px 0;
            padding: 0 16px;
            width: 100%;
        }
    
        .itemList {
            width: 100%;
            padding: 4px 0;
            display: grid;
            grid-template-columns: 240px 52px 1fr;
        }
    
        .total {
            width: 100%;
            text-align: center;
            font-size: 3rem;
            font-weight: 700;
        }
    </style>
    <div class="ticket">
        <h1>${barName}</h1>
        <h2>03/08/12</h2>
        <div class="list">
          ${itemsListHTML}
        </div>
        <h2>Total: $${total}</h2>
    </div>
    <script>
        window.onload = function() {
      window.print();
    }
    </script>
  </body>
  `;

  const ticketWindow = window.open("", "_blank", "width=400,height=600");
  ticketWindow.document.write(ticketContent);
  ticketWindow.document.close();
  if (selectedTable.position) {
    updateTableState();
  }
}

function printTicketComanda(itemsForComand) {
  const products = itemsForComand;
  const extraNote = document.querySelector("#comandaCommentInp");
  const productCounts = {};

  products.forEach((product) => {
    if (productCounts[product.name]) {
      productCounts[product.name].quantity++;
    } else {
      productCounts[product.name] = {
        name: product.name,
        price: product.price,
        quantity: 1,
      };
    }
  });

  let itemsListHTML = "";

  Object.values(productCounts).forEach((product) => {
    itemsListHTML += `
      <div class="itemList">
        <span>${product.name}</span>
        <span>${product.quantity}</span>
      </div>
    `;
  });

  const total = Object.values(productCounts)
    .reduce((acc, product) => acc + product.price * product.quantity, 0)
    .toFixed(2);

  const ticketContent = `
  <body>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: monospace;
            font-size: 85%;
            color: var(--eerie-black);
        }
    
        .dataContainer {
          width: 100%;
          text-align: center;
        }

        .ticket {
            width: 420px;
        }
    
        span {
            font-size: 2rem;
            text-align: center;
        }
    
        h1 {
            text-align: center;
            font-size: 5rem;
        }
    
        h2 {
            text-align: center;
            font-size: 3rem;
        }
    
        .list {
            margin: 24px 0;
            padding: 0 16px;
            width: 100%;
        }
    
        .itemList {
            width: 100%;
            padding: 4px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
        }
    
        .total {
            width: 100%;
            text-align: center;
            font-size: 3rem;
            font-weight: 700;
        }
    </style>
    <div class="ticket">
          <div class="dataContainer">
          <span>${selectedTable.name}</span>
        </div>
        <div class="list">
          ${itemsListHTML}
        </div>
        <div class="dataContainer">
          <span>${getFormatedTime()}</span>
        </div>
        <div class="dataContainer">
          <span>${extraNote.value}</span>
        </div>
    </div>
      <script>
    window.onload = function() {
      window.print();
    }
  </script>
  </body>
  `;

  const ticketWindow = window.open("", "_blank", "width=400,height=600");
  ticketWindow.document.write(ticketContent);
  ticketWindow.document.close();

  extraNote.value = "";
}

function populateSelect(selectId, options) {
  const selectElement = document.getElementById(selectId);

  selectElement.innerHTML = "";

  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.name;
    optionElement.textContent = option.name;
    selectElement.appendChild(optionElement);
  });
}

function printCashRegister(cashRegister) {
  var container = document.querySelector("#cajasList");
  const caja = document.createElement("div");
  caja.className = "caja";

  const labelSpan = document.createElement("span");
  labelSpan.textContent = cashRegister.name;
  caja.appendChild(labelSpan);

  const amountSpan = document.createElement("span");
  amountSpan.id = `register-${cashRegister.id}`;
  amountSpan.textContent = `$${cashRegister.total}`;
  caja.appendChild(amountSpan);

  container.appendChild(caja);
}

function createPm() {
  const input = document.querySelector("#pmName");
  const newPm = {
    name: input.value,
    total: 0,
    id: Date.now(),
  };
  paymentsMethods.push(newPm);
  input.value = "";
  printPm(newPm);
  saveData("paymentsMethods", paymentsMethods);
}

function printPm(pm) {
  const container = document.querySelector("#paymentMethodsList");
  const pme = document.createElement("div");
  pme.classList.add("flex");
  const span = document.createElement("span");
  span.classList.add("wfull");
  span.textContent = pm.name;
  const delBtn = createDeleteButton(paymentsMethods, pm.id);
  delBtn.addEventListener("click", function () {
    saveData("paymentsMethods", paymentsMethods);
  });
  pme.appendChild(span);
  pme.appendChild(delBtn);
  container.appendChild(pme);
  populateSelect("pmSlct", paymentsMethods);
}

function createDeleteButton(array, id) {
  const button = document.createElement("button");
  button.classList.add("discretBtn");
  const icon = document.createElement("i");
  icon.classList.add("material-icons");
  icon.textContent = "delete";
  button.appendChild(icon);

  button.addEventListener("click", function () {
    const index = array.findIndex((item) => item.id === id);
    if (index !== -1) {
      array.splice(index, 1);
    }

    if (button.parentElement) {
      button.parentElement.remove();
    }
  });

  return button;
}

const calcInput = document.querySelector(".calc input");
const resultSpan = document.querySelector(".result");
const vueltoSpan = document.querySelector(".calc span");
const buttons = document.querySelectorAll(".calc button");

let paidAmount = 0;

buttons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const value = event.target.textContent;

    if (value === "Calc") {
      calculateChange();
    } else {
      calcInput.value += value;
    }
  });
});

function calculateChange() {
  paidAmount = parseFloat(calcInput.value) || 0;

  if (paidAmount < selectedTable.total) {
    vueltoSpan.textContent = `Vuelto: $0.00`;
    resultSpan.textContent = "Monto insuficiente";
  } else {
    const change = (paidAmount - selectedTable.total).toFixed(2);
    vueltoSpan.textContent = `Vuelto: $${change}`;
    resultSpan.textContent = "";
  }
}

const barNameSpan = document.querySelector("#barNameSpan");
barNameSpan.textContent = JSON.parse(localStorage.getItem("barName"));

function updateBarName() {
  const input = document.querySelector("#barNameInput");
  barName = input.value;
  barNameSpan.textContent = barName;
  saveData("barName", barName);
}

const ntType = document.getElementById("ntType");
const ntImport = document.getElementById("ntImport");
const ntPm = document.getElementById("ntPm");
const ntProveedor = document.getElementById("ntProveedor");
const cancelNt = document.getElementById("cancelNt");
const confirmNt = document
  .getElementById("confirmNt")
  .addEventListener("click", createTransaction);
var isTrasnPositive = true;

function printTransactionDialog(type) {
  ntType.textContent = `Registrar nueva ${type}`;
  if (type == "entrada") {
    isTrasnPositive = true;
  } else {
    isTrasnPositive = false;
  }
  populateSelect("ntPm", paymentsMethods);
  switchDialogState("newTransaction");
}

function createTransaction() {
  const transactionData = {
    name: ntProveedor.value,
    total: parseInt(ntImport.value),
    paymentsMethod: ntPm.value,
    time: getFormatedTime(),
    date: getFormatedDate(),
    id: Date.now(),
    type: null,
  };
  if (!isTrasnPositive) {
    transactionData.total = transactionData.total * -1;
    transactionData.type = "arrow_upward";
  } else {
    transactionData.type = "arrow_downward";
  }
  sales.push(transactionData);
  printSale(transactionData);
  saveData("sales", sales);
  ntImport.value = "";
  ntProveedor.value = "";
  closeCurrentDialog();
}

function delLocalStorage(dataToDelete) {
  if (dataToDelete != "all") {
    localStorage.removeItem(dataToDelete);
  } else {
    localStorage.clear();
  }
}

function saveTablesToLocalStorage() {
  localStorage.setItem("tables", JSON.stringify(tables));
}

function loadTables() {
  const savedTables = localStorage.getItem("tables");
  if (savedTables) {
    tables = JSON.parse(savedTables);
    tables.forEach((table) => {
      printTable(table.position, table);
      selectedTable = table;
      updateTableState();
    });
    selectATable();
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key, variableToUpdate, containerSelector, printFunction) {
  const savedData = localStorage.getItem(key);
  if (savedData) {
    if (containerSelector) {
      document.querySelector(containerSelector).innerHTML = "";
      const parsedData = JSON.parse(savedData);
      parsedData.forEach(printFunction);
      variableToUpdate.length = 0;
      variableToUpdate.push(...parsedData);
    }
  }
}

function loadBoolean(key) {
  const value = localStorage.getItem(key);
  return value === "true";
}

var offerExample =
  localStorage.getItem("offerExample") !== null
    ? JSON.parse(localStorage.getItem("offerExample"))
    : true;

if (offerExample === true) {
  switchDialogState("firstTimeDialog");
  localStorage.setItem("offerExample", JSON.stringify(false));
}

function loadExampleData() {}

printShifts();
function printShifts() {
  shifts.forEach((shift) => {
    const shiftContainer = document.createElement("div");
    shiftContainer.innerHTML = `
            <div class="shiftsContainer flex">
                <div>
                    <h3>Fecha: ${shift.date} -- Hora de inicio: ${shift.startTime} -- Hora de salida: ${shift.endTime}</h3>
                </div>
                <div>
                  
                </div>
            </div>
    `;
    document.querySelector("#shiftsList").appendChild(shiftContainer);
  });
}

const themeBtn = document.querySelector("#toggleTheme");
const body = document.body;

function toggleTheme() {
  const currentTheme = body.getAttribute("data-theme");

  if (currentTheme === "light") {
    body.setAttribute("data-theme", "dark");
  } else {
    body.setAttribute("data-theme", "light");
  }
}

themeBtn.addEventListener("click", toggleTheme);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeCurrentDialog();
    if (!selectedTable.position) {
      selectATable();
    }
  }
});

loadData("sales", sales, "#cashHistoryList", printSale);
loadData("paymentsMethods", paymentsMethods, "#paymentMethodsList", printPm);
populateSelect("pmSlct", paymentsMethods);
loadTables();
selectATable();
shiftManagment();
loadFromLocalStorage();
window.closeCurrentDialog = closeCurrentDialog;
