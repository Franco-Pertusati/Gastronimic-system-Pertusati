document.addEventListener("DOMContentLoaded", function () {
  var groups = [
    {
      name: "Pintas",
      products: [
        { name: "Golden", price: 100 },
        { name: "Scottish", price: 100 },
        { name: "Ipa", price: 100 },
      ],
    },
    {
      name: "Bebidas",
      products: [
        { name: "Coca 1L", price: 100 },
        { name: "Coca 1.5L", price: 150 },
        { name: "Coca 3L", price: 300 },
      ],
    },
  ];

  var money = 0;
  var tables = [];
  var preOrder = [];
  var selectedTable = null;
  var selectedTableJS = null;
  var transactionsList = [];

  printGroupArrayMenu();
  printTablesInSalon();

  //Creacion de grupos
  document
    .querySelector("#createGroupArray")
    .addEventListener("click", function () {
      const gName = document.querySelector("#aNameInput").value.trim();
      const group = { name: gName, products: [] };
      groups.push(group);
      printGroupArrayMenu();
      //Limpieza de imputs
      document.querySelector("#aNameInput").value = "";
    });

  //Creacion de productos
  document
    .querySelector("#createProductArray")
    .addEventListener("click", function () {
      const pName = document.querySelector("#aNameInput2").value.trim();
      const pPrice = document.querySelector("#aPriceInput").value.trim();
      const gProduct = document.querySelector("#GroupSelect").value;

      const product = { name: pName, price: pPrice };
      let selectedGroup = groups.find((group) => group.name === gProduct);
      selectedGroup.products.push(product);
      printGroupArrayMenu();
      //Limpieza de imputs
      document.querySelector("#aNameInput2").value = "";
      document.querySelector("#aPriceInput").value = "";
    });

  //Creacion de Mesas
  document.querySelector("#createTable").addEventListener("click", function () {
    const tName = tables.length + 1;
    const table = { name: tName, items: [], total: 0 };
    tables.push(table);
    printTablesInSalon();
  });

  //Imprimir los arrays de la carta
  function printGroupArrayMenu(pName, pPrice) {
    const conteiner = document.querySelector("#groupConteiner");
    const selectElement = document.querySelector("#GroupSelect");
    conteiner.innerHTML = "";
    selectElement.innerHTML = "";
    //Esta es la forma de imprimir para la ventana de la carta
    //y llenar el elemento select
    groups.forEach((group) => {
      //Primero imprimimos en el DOM el listado de grupos
      const newGroup = document.createElement("div");
      const groupContent = document.createElement("div");
      newGroup.classList.add("listElement");
      newGroup.classList.add("group");
      newGroup.classList.add("background");
      newGroup.textContent = group.name + ":";
      newGroup.appendChild(groupContent);
      conteiner.appendChild(newGroup);
      //Segundo añadimos una opcion a nuestro select por cada grupo que creamos
      const option = document.createElement("option");
      option.value = group.name;
      option.text = group.name;
      selectElement.appendChild(option);
      //Ahora se procede a agregarle los items a cada grupo
      group.products.forEach((product) => {
        const newProduct = document.createElement("div");
        newProduct.classList.add("listElement");
        newProduct.classList.add("twoCellgrid");
        const p1 = document.createElement("p");
        const p2 = document.createElement("p");
        p1.textContent = product.name;
        p2.textContent = "$" + product.price;
        newProduct.appendChild(p1);
        newProduct.appendChild(p2);
        groupContent.appendChild(newProduct);
      });
    });
  }

  function printTablesInSalon() {
    const salon = document.querySelector(".salon");
    salon.innerHTML = "";
    console.log(tables)
    tables.forEach(table => {
      const newTable = document.createElement("button");
      newTable.classList.add("squareButton");
      newTable.textContent = table.name;
      newTable.id = table.name;
      salon.appendChild(newTable);
      //seleccion de mesa
      newTable.addEventListener("click", function () {
        if (selectedTable) {
          // Si hay una tabla seleccionada, quitar la clase tableSelected
          selectedTable.classList.remove("tableSelected");
          // printTableInventory();
        }
        newTable.classList.add("tableSelected");
        selectedTable = newTable;
        findingTheRealSelectedTable();
        //Mostrar la mesa seleccionada en el menu de mesa
        const selectedTableDisplay = document.querySelectorAll(".selectedTable");
        selectedTableDisplay.forEach((a) => {
          a.textContent = "Mesa:" + " " + selectedTable.textContent;
          // Se actualiza el muestreo del inventario de la mesa
          printTableList(false);
        });
      });
    });
  }

  //como selectedTable hace referencia a un objeto html con el mismo nombre y no al objeto dentro de los datos
  //hago esta funcion para determinar que objeto de js es
  function findingTheRealSelectedTable() {
    tIndex = selectedTable.textContent;
    selectedTableJS = tables[tIndex - 1];
  }

  //Impresion de grupos y productos en la ventana del inventario de mesa
  function printMenuInTable() {
    const groupTabs = document.querySelector(".groupsTabs");
    groupTabs.innerHTML = "";
    groups.forEach((group) => {
      const newGroupBtn = document.createElement("button");
      newGroupBtn.classList.add("squareButton");
      newGroupBtn.textContent = group.name;
      groupTabs.appendChild(newGroupBtn);
      newGroupBtn.addEventListener("click", function () {
        groupSelected = newGroupBtn.textContent;
        const conteiner = document.querySelector(".productButtons");
        conteiner.innerHTML = "";
        const groupToPrint = groups.find(
          (group) => group.name === groupSelected
        );
        groupToPrint.products.forEach((product) => {
          const newProduct = document.createElement("button");
          const p1 = document.createElement("p");
          const p2 = document.createElement("p");
          p1.textContent = product.name;
          p2.textContent = "$" + product.price;
          newProduct.appendChild(p1);
          newProduct.appendChild(p2);
          newProduct.setAttribute("data-name", product.name);
          conteiner.appendChild(newProduct);
          newProduct.addEventListener("click", function () {
            //Se añanden a una lista los objetos que queremos cargar a la mesa
            const allProducts = groups.flatMap((group) => group.products);
            const productToAdd = allProducts.find(
              (a) => a.name === product.name
            );
            preOrder.push(productToAdd);
            const a = true;
            printTableList(a);
          });
        });
      });
    });
  }

  function printTableList(a) {
    let container;
    let total;
    let itemsToPrint;

    if (a) {
      container = document.querySelector(".preOrdersList");
      total = document.querySelector("#subTotal");
      itemsToPrint = preOrder;
    } else {
      document.querySelector(".preOrdersList").innerHTML = "";
      document.querySelector("#subTotal").innerHTML = "";
      container = document.querySelector("#tableContent");
      total = document.querySelector("#tableTotal");
      itemsToPrint = selectedTableJS.items;
    }

    container.innerHTML = "";
    total.innerHTML = "";
    const productCounts = {};
    let subTotal = 0;

    itemsToPrint.forEach((product) => {
      subTotal += product.price;
      if (product.name in productCounts) {
        productCounts[product.name]++;
      } else {
        productCounts[product.name] = 1;
      }
    });

    for (const productName in productCounts) {
      const quantity = productCounts[productName];
      const newProduct = document.createElement("div");
      const p1 = document.createElement("p");
      const p2 = document.createElement("p");
      newProduct.classList.add("listElement");
      newProduct.classList.add("prodItem");
      newProduct.appendChild(p1);
      newProduct.appendChild(p2);
      p1.textContent = "x" + quantity + " " + productName;
      p2.textContent =
        "$" + itemsToPrint.find((p) => p.name === productName).price * quantity;
      container.appendChild(newProduct);
    }
    total.textContent = "$" + subTotal;
    selectedTableJS.total = subTotal;
  }

  //Funcionalidad de boton de comandar y cancelar comanda
  const comandarBtn = document.querySelector(".comandar");
  const cancelarComandaBtn = document.querySelector(".cancelarComanda");

  comandarBtn.addEventListener("click", function () {
    selectedTableJS.items.push(...preOrder);
    preOrder = [];
    printTableList(false);
  });
  cancelarComandaBtn.addEventListener("click", function () {
  });

  document
    .querySelector("#createExpense")
    //Declaramos el input de el motivo y proximamente del metodo de pago
    .addEventListener("click", function () {
      const transactionAmount = document.querySelector("#expenseAmount").value * -1;
    });

  document
    .querySelector("#createIncome")
    .addEventListener("click", function () {
      //Declaramos el input de el motivo y proximamente del metodo de pago
      const transactionReason = document.querySelector("#incomeReason").value;
      const transactionAmount = document.querySelector("#incomeAmount").value;
      //Primero modifico los valores en los datos (aclarondo tambien que son flotas asi no nos lo toma como un string)
      addTransaction(transactionAmount, transactionReason);
      //Ahora limpiamos todos los imputs
      transactionAmount.value = " ";
      transactionReason.value = " ";
      //con esta funcion se manda a imprimir el array en el dom
      printTransactions();
    });

  //Con esta funcion asignamos nuevas transacciones, ya sea de dinero entrante, saliente a travez de una mesa o con una transaccion personalizada
  function addTransaction(transactionAmount, transactionReason) {
    const transaction = {
      reason: transactionReason,
      amount: transactionAmount,
      date: new Date(),
    };
    transactionsList.push(transaction);
  }

  function printTransactions() {
    const listConteiner = document.querySelector(".paymentsHistoryList");
    listConteiner.innerHTML = "";
    transactionsList.forEach((transaction) => {
      const newTransaction = document.createElement("div");
      const fecha = transaction.date;
      const dia = fecha.getDate();
      const mes = fecha.getMonth() + 1; // Los meses en JavaScript son indexados desde 0
      const año = fecha.getFullYear();
      const p1 = document.createElement("p");
      const p2 = document.createElement("p");
      const p3 = document.createElement("p");
      p1.textContent = transaction.amount;
      p1.classList.add("listeElement");
      if (transaction.amount > 0) {
        p1.classList.add("positiveAmount");
        p2.classList.add("positiveAmount");
        p3.classList.add("positiveAmount");
      } else {
        p1.classList.add("negativeAmount");
        p2.classList.add("negativeAmount");
        p3.classList.add("negativeAmount");
      }
      p2.textContent = transaction.reason;
      p2.classList.add("listeElement");
      p3.textContent = dia + "/" + mes + "/" + año;
      p3.classList.add("listeElement");
      listConteiner.appendChild(newTransaction);
      newTransaction.appendChild(p1);
      newTransaction.appendChild(p2);
      newTransaction.appendChild(p3);
      newTransaction.classList.add("transaction")
    });
  }

  //------------------------------------- menuMagnament --------------------------

  document.querySelectorAll("#cartaWinSwitch").forEach((btn) => {
    btn.addEventListener("click", function () {
      const window = document.querySelector("#cartaWin");
      openCloseWindows(window);
    });
  });

  document.querySelectorAll("#cajaCtrlBtn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const window = document.querySelector(".cajaCtrl");
      openCloseWindows(window);
    });
  });

  document.querySelectorAll("#paymentsHistoryBtn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const window = document.querySelector(".paymentsHistory");
      openCloseWindows(window);
    });
  });

  document.querySelectorAll("#newPaymentBtn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const window = document.querySelector("#newPayment");
      openCloseWindows(window);
    });
  });

  document.querySelectorAll("#newPaymentBtn2").forEach((btn) => {
    btn.addEventListener("click", function () {
      const window = document.querySelector("#newPayment2");
      openCloseWindows(window);
    });
  });

  document.querySelectorAll("#openTableInventoryMenu").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (selectedTable === null) {
        alert("Seleccione una mesa");
      } else {
        const window = document.querySelector("#tableInventory");
        openCloseWindows(window);
        printMenuInTable();
      }
    });
  });

  document.querySelectorAll("#close1").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (selectedTable === null) {
        alert("Seleccione una mesa");
      } else {
        const transactionAmount = selectedTableJS.total;
        const transactionReason = "Mesa:" + selectedTableJS.name;
        addTransaction(transactionAmount, transactionReason);
        const window = document.querySelector("#askCloseTable");
        openCloseWindows(window);
      }
    });
  });

  const panelSalonbtns = document.querySelectorAll("#panelSalonbtn");
  const panelSalonWindows = document.querySelectorAll("#panelSalonPag");

  switchWindows(panelSalonWindows, panelSalonbtns);

  document.querySelectorAll("#openCloseSwap").forEach((btn) => {
    btn.addEventListener("click", function () {
      const window = document.querySelector("#swapTablesWin");
      openCloseWindows(window);
      const select = document
        .querySelectorAll("#tablesSlct")
        .forEach((slct) => {
          conteiner = slct;
          tables.forEach((table) => {
            const option = document.createElement("option");
            option.value = table.name;
            option.text = table.name;
            conteiner.appendChild(option);
          });
        });
    });
  });

  // document.querySelector("").addEventListener("click", function () {
  //   const table1 = document.querySelector("").value;
  //   const table2 = document.querySelector("").value;
  //   swapTables(table1, table2);
  // });

  //Funcion para intercambiar los inventarios de las mesas
  function swapTables(table1, table2) {
    let table0 = [];
    table0.push(table1);
    table1.push(table2);
    table2.push(table0);
  }

  // Funcion que con una cantidad infinita de botones que hacen de switch para hacer desaparecer o aparecer un solo menú
  function openCloseWindows(window) {
    window.classList.toggle("hide");
  }

  // Funcion con la que se manejan varios menus con sus respectivos botones
  function switchWindows(windowsArray, buttonsArray) {
    if (windowsArray.length === buttonsArray.length) {
      Array.from(buttonsArray).forEach((btn, index) => {
        btn.addEventListener("click", function () {
          windowsArray.forEach((window) => {
            window.classList.add("hide");
          });
          windowsArray[index].classList.remove("hide");
        });
      });
    } else {
      return;
    }
  }
});
