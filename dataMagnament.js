document.addEventListener("DOMContentLoaded", function () {
  var groups = [];
  var tables = [];
  var preOrder = [];
  var selectedTable = null;
  var selectedTableJS = null;
  var transactionsList = [];
  var paymentMethods = [];
  var ingredientsList = [];
  var barName = "";

  //Variables para los tickets/recibos
  customText1 = localStorage.getItem("customText1") || "";
  customText2 = localStorage.getItem("customText2") || "";
  fontWeightValue = parseFloat(localStorage.getItem("fontWeightValue")) || "";
  fontSharpnessValue =
    parseFloat(localStorage.getItem("fontSharpnessValue")) || "";
  ticketDate = localStorage.getItem("ticketDate") || "none";
  ticketHour = localStorage.getItem("ticketHour") || "none";

  document.querySelector("#ct2").value = customText1;
  document.querySelector("#ct1").value = customText2;
  document.querySelector("#fwv").value = fontWeightValue;
  document.querySelector("#fsv").value = fontSharpnessValue;
  document.querySelector("#dateToggle").checked = ticketDate === "block";
  document.querySelector("#hourToggle").checked = ticketHour === "block";

  const preOrder1 = document.querySelector("#preOrderItemsList");
  const subTotal1 = document.querySelector("#subTotal");

  const preOrder2 = document.querySelector("#mostradorWinpreOrder");
  const subTotal2 = document.querySelector("#mostradorWintotal");

  const itemsList1 = document.querySelector("#itemsList");
  const total1 = document.querySelector("#tableTotal");

  slotCreation();
  fillPaymentsMethodsSlct();

  if (localStorage.getItem("ingredients")) {
    loadIngredients("ingredients", ingredientsList);
  }

  if (localStorage.getItem("paymentsMethods")) {
    loadPM("paymentsMethods", paymentMethods);
    printPaymentsMethodsList();
  }

  if (localStorage.getItem("tables")) {
    loadTables();
  } else {
    createTable("start");
  }

  if (localStorage.getItem("groups")) {
    loadGroups();
  }

  printGroupArrayMenu();

  loadData("barName");

  //Creacion de grupos
  document
    .querySelector("#createGroupArray")
    .addEventListener("click", function () {
      const gName = document.querySelector("#aNameInput").value.trim();
      if (gName != "") {
        createGroup(gName);
        showNotification(`Grupo creado correctamente`);
      } else {
        showNotification(`Error. Introduzca un nombre para el grupo`);
      }
    });

  function createGroup(gName) {
    const group = { name: gName, products: [] };
    groups.push(group);
    printGroupArrayMenu();
    //Limpieza de imputs
    document.querySelector("#aNameInput").value = "";
    saveData("groups", groups);
  }

  function createProduct(pName, pPrice, pGroup) {
    const product = { name: pName, price: pPrice, ingredients: [] };
    var selectedGroup = groups.find((group) => group.name === pGroup);
    selectedGroup.products.push(product);
    printGroupArrayMenu();
    saveData("groups", groups);
  }

  document
    .querySelector("#createProductArray")
    .addEventListener("click", function () {
      const pName = document.querySelector("#aNameInput2").value.trim();
      const pPrice = document.querySelector("#aPriceInput").value.trim();
      const pGroup = document.querySelector("#GroupSelect").value.trim();

      // Expresión regular para verificar si el precio contiene solo números
      const priceRegex = /^\d+$/;

      if (pName && pPrice !== "" && priceRegex.test(pPrice)) {
        createProduct(pName, pPrice, pGroup);
        // Limpieza de inputs
        document.querySelector("#aNameInput2").value = "";
        document.querySelector("#aPriceInput").value = "";
        showNotification(`${pName} agregado con exito a ${pGroup}`);
      } else {
        showNotification(
          `Error. Introduzca un nombre y un valor numérico para el producto.`
        );
      }
    });

  // Creación de los hueco/slots para las mesas
  function slotCreation() {
    const itemName = "salonDistribution";
    const containerId = "salonConteiner";
    var salonGrid = document.querySelector(".salon");
    var salonClass = window.getComputedStyle(salonGrid);
    var numColumns = parseInt(
      salonClass.getPropertyValue("grid-template-columns").split(" ").length
    );
    var numRows = parseInt(
      salonClass.getPropertyValue("grid-template-rows").split(" ").length
    );
    // Slots necesarios para generar
    var totalSlots = numColumns * numRows;
    for (var i = 0; i < totalSlots; i++) {
      const slot = document.createElement("div");
      slot.id = "slot" + i; // Modificación para que el ID sea único
      slot.classList.add("slot");
      slot.addEventListener("dragover", function (event) {
        event.preventDefault();
      });
      salonGrid.appendChild(slot);
      slot.addEventListener("drop", function (event) {
        event.preventDefault();
        var tableId = event.dataTransfer.getData("text/plain"); // Cambiado para ser más específico
        var table = document.getElementById(tableId);
        if (table.parentElement.classList.contains("tableTool")) {
          // Verificar si la mesa no está en un slot antes de agregar una nueva mesa
          createTable("start");
        }
        event.target.appendChild(table);
        table.setAttribute("data-position", event.target.id);
        //Registro de posiciones de mesas
        tableToUpdate = tables[table.id];
        tableToUpdate.position = event.target.id;
        saveData("tables", tables);
      });
    }
  }

  //Creacion de mesas
  function createTable(position) {
    const tName = tables.length;
    const table = { name: tName, items: [], ocuped: false, position: "start" };
    const container = document.querySelector(".tableTool");
    const newTable = document.createElement("div");
    newTable.classList.add("squareButton");
    newTable.classList.add("table");
    newTable.id = tName;
    newTable.textContent = tName + 1;
    newTable.draggable = true;
    if (position === "start") {
      container.appendChild(newTable);
      table.position = "start";
    } else {
      const conteiner = document.getElementById(position);
      conteiner.appendChild(newTable);
      //Cuando las mesas se crean mediante la funcion loadTables no se les agrega una data-position
      newTable.setAttribute("data-position", position);
      table.position = position;
    }
    newTable.addEventListener("dragstart", function (event) {
      event.dataTransfer.setData("text/plain", event.target.id);
    });
    tables.push(table);
    //Seleccion de mesas
    newTable.addEventListener("click", function () {
      if (selectedTable) {
        // Si hay una mesa seleccionada, quitar la clase tableSelected
        selectedTable.classList.remove("tableSelected");
      }
      newTable.classList.add("tableSelected");
      selectedTable = newTable;
      tIndex = selectedTable.textContent - 1;
      selectedTableJS = tables[selectedTable.id];
      //Mostrar la mesa seleccionada en el menu de mesa
      const selectedTableDisplay = document.querySelectorAll(".selectedTable");
      selectedTableDisplay.forEach((a) => {
        a.textContent = "Mesa seleccionada: " + selectedTable.textContent;
        // Se actualiza el muestreo del inventario de la mesa
      });
      printItemList(itemsList1, total1);
    });
  }

  var selectedProd = null;

  //Imprimir los arrays de la carta
  function printGroupArrayMenu() {
    groups.forEach((group) => {
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
        const delGroup = document.createElement("button");
        const btnIco3 = document.createElement("ion-icon");
        btnIco3.setAttribute("name", "trash-outline");
        newGroup.classList.add("listElement");
        newGroup.classList.add("group");
        newGroup.classList.add("background");
        newGroup.textContent = group.name + ":";
        newGroup.appendChild(groupContent);
        newGroup.appendChild(delGroup);
        conteiner.appendChild(newGroup);
        delGroup.append(btnIco3);
        //Segundo añadimos una opcion a nuestro select por cada grupo que creamos
        const option = document.createElement("option");
        option.value = group.name;
        option.text = group.name;
        selectElement.appendChild(option);
        //Funcionalidad para eliminar grupos
        delGroup.addEventListener("click", function () {
          // Encontrar el índice del grupo en el array
          const index = groups.findIndex((g) => g.name === group.name);
          if (index !== -1) {
            // Si se encontró el grupo, eliminarlo del array
            groups.splice(index, 1);
            // Eliminar el elemento del DOM
            conteiner.removeChild(newGroup);
            // Guardar los cambios en el almacenamiento
            saveData("groups", groups);
          }
        });
        //Ahora se procede a agregarle los items a cada grupo
        group.products.forEach((product) => {
          const newProduct = document.createElement("div");
          newProduct.classList.add("listElement");
          newProduct.classList.add("groupElement");
          const p1 = document.createElement("p");
          const p2 = document.createElement("p");
          const groupBtn = document.createElement("div");
          const groupBtn2 = document.createElement("div");
          const btnIco = document.createElement("ion-icon");
          const btnIco2 = document.createElement("ion-icon");
          btnIco.setAttribute("name", "trash-outline");
          btnIco2.setAttribute("name", "create-outline");
          groupBtn.appendChild(btnIco);
          groupBtn2.appendChild(btnIco2);
          p1.textContent = product.name;
          p2.textContent = "$" + product.price;
          newProduct.appendChild(p1);
          newProduct.appendChild(p2);
          newProduct.appendChild(groupBtn);
          newProduct.appendChild(groupBtn2);
          groupContent.appendChild(newProduct);
          //Funcionalidad de el boton de borrar producto
          btnIco.addEventListener("click", function () {
            groupContent.removeChild(newProduct);
            const prodToRemove = groups
              .flatMap((group) => group.products)
              .find((product) => p1.textContent === product.name);
            // Filtra el array groups para excluir el objeto prodToRemove
            groups.forEach((group) => {
              group.products = group.products.filter(
                (product) => product !== prodToRemove
              );
            });
            saveData("groups", groups);
          });
          //Funcionalidad del boton de editar producto y añadirle ingredientes (ahora se despliega un ventana para hacerlo)
          btnIco2.addEventListener("click", function () {
            printAllIngredients(
              document.querySelector(".allIngrdientsList2"),
              ingredientsList,
              3
            );

            const window = document.querySelector("#editProductSlct");
            openCloseWindows(window);
            // Filtra el array groups para excluir el objeto prodToRemove
            const prodToEdit = groups
              .flatMap((group) => group.products)
              .find((product) => p1.textContent === product.name);
            selectedProd = prodToEdit;

            //Ahora se renderizan los datos en los inputs de edicion
            const nameInput = document.querySelector("#prodNameToEdit");
            const priceInput = document.querySelector("#prodPriceToEdit");

            nameInput.value = selectedProd.name;
            priceInput.value = selectedProd.price;

            document
              .querySelector("#apllyNewData")
              .addEventListener("click", function () {
                document
                  .querySelector("#editProductSlct")
                  .classList.add("hide");

                selectedProd.name = nameInput.value;
                selectedProd.price = priceInput.value;
                printGroupArrayMenu();
                nameInput.value = "";
                priceInput.value = "";
                selectedProd = null;
                document.querySelector("#huecoIngredientesProd").innerHTML = "";
                saveData("groups", groups);
              });
          });
        });
      });
    });
  }

  var selectedBtn = null;

  //Impresion de grupos y productos en la ventana del inventario de mesa
  function printMenuInTable(groupTabs, productsConteiner) {
    groupTabs.innerHTML = " ";
    groups.forEach((group) => {
      const newGroupBtn = document.createElement("button");
      newGroupBtn.classList.add("squareButton");
      newGroupBtn.textContent = group.name;
      groupTabs.appendChild(newGroupBtn);
      newGroupBtn.addEventListener("click", function () {
        if (selectedBtn) {
          selectedBtn.classList.remove("selectedBtn");
        }
        newGroupBtn.classList.add("selectedBtn");
        selectedBtn = newGroupBtn;
        groupSelected = newGroupBtn.textContent;
        productsConteiner.innerHTML = "";
        const groupToPrint = groups.find(
          (group) => group.name === groupSelected
        );
        groupToPrint.products.forEach((product) => {
          const newProduct = document.createElement("button");
          const p1 = document.createElement("p");
          const p2 = document.createElement("p");
          p1.textContent = product.name;
          p2.textContent = "$" + product.price;
          newProduct.classList.add("productTableBtn");
          newProduct.appendChild(p1);
          newProduct.appendChild(p2);
          newProduct.setAttribute("data-name", product.name);
          productsConteiner.appendChild(newProduct);
          newProduct.addEventListener("click", function () {
            //Se añanden a una lista los objetos que queremos cargar a la mesa
            const allProducts = groups.flatMap((group) => group.products);
            const productToAdd = allProducts.find(
              (a) => a.name === product.name
            );
            preOrder.push(productToAdd);
            printPreorder(preOrder1, subTotal1);
            printPreorder(preOrder2, subTotal2);
          });
        });
      });
    });
  }

  function printItemList(itemsList, total) {
    itemsList.innerHTML = "";
    const productCounts = {};
    var subTotal = 0;

    const itemToPrint = selectedTableJS.items;

    itemToPrint.forEach((product) => {
      subTotal += parseFloat(product.price); // Convertir el precio a número
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
        "$" + itemToPrint.find((p) => p.name === productName).price * quantity; // No es necesario multiplicar por quantity aquí, ya que ya se hizo en el cálculo de subTotal
      itemsList.appendChild(newProduct);
    }
    total.textContent = "$" + subTotal.toFixed(2); // Redondear el total a 2 decimales
    selectedTableJS.total = subTotal;
  }

  //Funcion para imprimir todo lo que esta en preOrder y mostrarlo de forma que los items repetidos se apilen
  //Todo lo que esta en preOrder son items que no se confirmo su pedido

  var subTotal = 0;

  function printPreorder(preOrderItemsList, total) {
    preOrderItemsList.innerHTML = "";
    const productCounts = {};
    subTotal = 0;

    preOrder.forEach((product) => {
      subTotal += parseFloat(product.price); // Convertir el precio a número
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
        "$" + preOrder.find((p) => p.name === productName).price * quantity;
      preOrderItemsList.appendChild(newProduct);
    }
    total.textContent = "$" + subTotal.toFixed(2); // redondea el total a 2 decimales
  }

  //Funcionalidad de boton de comandar y cancelar comanda
  const comandarBtn = document.querySelector(".comandar");
  const cancelarComandaBtn = document.querySelector(".cancelarComanda");

  comandarBtn.addEventListener("click", function () {
    selectedTableJS.items.push(...preOrder);
    preOrder = [];
    if (selectedTableJS.items.length > 0) {
      selectedTable.classList.add("ocuped");
      selectedTableJS.ocuped = true;
    }
    printItemList(
      document.querySelector("#itemsList"),
      document.querySelector("#tableTotal")
    );
  });
  cancelarComandaBtn.addEventListener("click", function () {
    preOrder = [];
  });

  document
    .querySelector("#createExpense")
    .addEventListener("click", function () {
      // Declaramos el input de el motivo y próximamente del método de pago
      const reason = document.querySelector("#expenseReason").value;
      const num = document.querySelector("#expenseAmount").value;

      const amount = num * -1;

      pm = document.querySelector(".PM3").value;

      // Ahora limpiamos todos los inputs
      document.querySelector("#expenseAmount").value = ""; // Limpiamos el input de amount
      document.querySelector("#expenseReason").value = ""; // Limpiamos el input de reason

      // con esta función se manda a imprimir el array en el DOM
      if (reason && amount != "") {
        createTransaction(amount, reason, pm);
        showNotification(`Movimiento registrado correctamente por $${amount}`);
      }
    });

  document
    .querySelector("#createIncome")
    .addEventListener("click", function () {
      // Declaramos el input de el motivo y próximamente del método de pago
      const reason = document.querySelector("#incomeReason").value;
      const amount = document.querySelector("#incomeAmount").value;
      // Convertimos amount a un número decimal

      // Ahora limpiamos todos los inputs
      document.querySelector("#incomeAmount").value = ""; // Limpiamos el input de amount
      document.querySelector("#incomeReason").value = ""; // Limpiamos el input de reason

      pm = document.querySelector(".PM2").value;

      // con esta función se manda a imprimir el array en el DOM
      if (reason && amount != "") {
        createTransaction(amount, reason, pm);
        showNotification(`Movimiento registrado correctamente por $${amount}`);
      }
    });

  //Confirmar cierre de mesa
  document.querySelector("#closeTable").addEventListener("click", function () {
    paymentMethod = document.querySelector(".PM1").value;
    closeTable(selectedTableJS, paymentMethod);
  });

  function closeTable(tableToClose, paymentMethod) {
    amount = tableToClose.total;
    //Creamos el ticket en una pestaña nueva
    createTicket(tableToClose.items, tableToClose.total, tableToClose.name + 1);
    tableToClose.items = [];
    tableToClose.total = 0;
    printItemList(
      document.querySelector("#itemsList"),
      document.querySelector("#tableTotal")
    );
    document.querySelector("#askCloseTable").classList.add("hide");
    tableToClose.ocuped = false;
    //Buscamos el elemento html que representa esta mesa para completar algunos datos y mostrarla como vacia
    const htmlTables = document.querySelectorAll(".table");
    const selectedHtmlTable = Array.from(htmlTables).find(
      (table) => table.id === tableToClose.name.toString()
    );
    selectedHtmlTable.classList.remove("ocuped");
    pm = paymentMethod;
    reason = "Mesa: " + selectedHtmlTable.textContent;
    createTransaction(amount, reason, pm);
    showNotification(`${reason} cerrada correctamente`);
  }

  function createTicket(items, total, name) {
    console.log(ticketDate);
    // Construir el contenido del ticket
    const ticketContent = `
        <html>
        <head>
            <title>Ticket de Mesa: X</title>
        </head>
        <body>
            <h1>${barName} - Mesa: ${name}</h1>
            <div></div>
            <ul>
                ${items
                  .map((item) => `<li>${item.name}: $${item.price}</li>`)
                  .join("")}
            </ul>
            <div></div>
            <p class="total">Total: $${total}</p>
            <p class="date">Fecha: ${day}/${month}/${year}</p>
            <p>${customText1}</p>
            <p>${customText2}</p>
        </body>
        </html>
        <style>
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
    }

    * {
        font-weight: ${fontSharpnessValue};
        color: hsla(0, 0%, 0%, ${fontWeightValue});
    }

    div {
      border: dashed 1px black
    }
    h1, .total {
        text-align: center;
        font-size: 32px;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        margin-bottom: 5px;
        list-style: none;
    }

    p {
        margin-top: 20px;
        text-align: center;
    }

    .date {
      display: ${ticketDate}
    }
</style>
    `;

    // Abrir una nueva pestaña con el contenido del ticket
    const ticketWindow = window.open("", "_blank", "width=400,height=600");
    ticketWindow.document.write(ticketContent);
    ticketWindow.document.close();
  }

  const date = new Date();
  const day = date.getDate();
  // Los meses en JavaScript son indexados desde 0
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  function createTransaction(amount, reason, pm) {
    const transaction = {
      reason: reason,
      amount: amount,
      paymentMethod: pm,
      date: new Date(),
    };
    transactionsList.push(transaction);
    printTransactions();
    let balance = 0;
    const conteiner = document.querySelector(".paymentsHistoryResult");
    transactionsList.forEach((transaction) => {
      balance += parseInt(transaction.amount);
    });

    conteiner.textContent =
      "Balance: $" +
      balance +
      " - - - " +
      "Fecha: " +
      day +
      "/" +
      month +
      "/" +
      year;

    document.querySelector("#totalMoney").textContent = "$" + balance;
  }

  function printTransactions() {
    const listConteiner = document.querySelector(".paymentsHistoryList");
    listConteiner.innerHTML = "";
    transactionsList.forEach((transaction) => {
      const newTransaction = document.createElement("div");
      const fecha = transaction.date;
      const horas = fecha.getHours();
      const minutos = fecha.getMinutes();
      const p1 = document.createElement("p");
      const p2 = document.createElement("p");
      const p3 = document.createElement("p");
      const p4 = document.createElement("p");
      p1.textContent = "$ " + transaction.amount;
      if (transaction.amount < 0) {
        p1.textContent = "$" + transaction.amount;
        p1.classList.add("negativeAmount");
        p2.classList.add("negativeAmount");
        p3.classList.add("negativeAmount");
        p4.classList.add("negativeAmount");
      }
      p2.textContent = transaction.reason;
      p3.textContent = horas + ":" + minutos;
      p4.textContent = transaction.paymentMethod;
      listConteiner.appendChild(newTransaction);
      newTransaction.appendChild(p1);
      newTransaction.appendChild(p2);
      newTransaction.appendChild(p4);
      newTransaction.appendChild(p3);
      newTransaction.classList.add("transaction");
    });
  }

  //Creacion de metodos de pago
  const paymentMethodName = document.querySelector("#paymentMethodName");
  document
    .querySelector("#addPaymenMethod")
    .addEventListener("click", function () {
      createPaymentMethod();
    });

  function createPaymentMethod() {
    paymentMethods.push(paymentMethodName.value);
    printPaymentsMethodsList();
    paymentMethodName.value = "";
    saveData("paymentsMethods", paymentMethods);
  }
  //Funcion para crear un boton de borrado generico
  function createDelBtn(
    conteiner,
    arrayToEdit,
    elementToDelete,
    index,
    dataName
  ) {
    // Agregar el botón de eliminación
    const delBtn = document.createElement("button");
    const tCan = document.createElement("ion-icon");
    tCan.setAttribute("name", "trash-outline");
    delBtn.appendChild(tCan);
    delBtn.addEventListener("click", function () {
      // Eliminar el elemento PM del DOM y del array cuando se hace clic en el botón de eliminación
      conteiner.removeChild(elementToDelete);
      arrayToEdit.splice(index, 1); // Eliminar el elemento del array
      saveData(dataName, arrayToEdit);
      console.log(dataName, arrayToEdit);
    });
    delBtn.classList.add("delBtn");
    elementToDelete.appendChild(delBtn);
    // console.log("creado delBtn en: ", conteiner, " y va a eliminar: ", elementToDelete.textContent, " de ", arrayToEdit)
  }

  //Funcion para imprimir los metodos de pago en la lista del menu
  function printPaymentsMethodsList() {
    const conteiner = document.querySelector(".paymentsMethodsList");
    conteiner.innerHTML = "";

    paymentMethods.forEach((element, index) => {
      const newPM = document.createElement("div");
      newPM.classList.add("pm");
      newPM.textContent = element;
      createDelBtn(conteiner, paymentMethods, newPM, index, "paymentsMethods");
      conteiner.appendChild(newPM);
    });
    fillPaymentsMethodsSlct();
  }

  //Creacion de ingredientes
  document
    .querySelector("#createIngredient")
    .addEventListener("click", function () {
      const ingredientName = document.querySelector("#ingredientName");
      const ingredientCant = document.querySelector("#ingredientCant");
      const ingredientMet = document.querySelector("#ingredientMet");
      //Comprobamos que el input no este vaico
      if (ingredientName.value != "") {
        const ingredient = {
          name: ingredientName.value,
          cant: ingredientCant.value,
          met: ingredientMet.value,
        };
        ingredientsList.push(ingredient);
        printAllIngredients(
          document.querySelector("#allIngrdients"),
          ingredientsList,
          1
        );
      }
      ingredientName.value = "";
      saveData("ingredients", ingredientsList);
    });

  function printAllIngredients(container, ingredients, delV) {
    container.innerHTML = ""; // Limpia el contenido del contenedor
    ingredients.forEach((ingredient, index) => {
      const newIngredient = document.createElement("div");
      newIngredient.textContent =
        ingredient.name + " " + ingredient.cant + " " + ingredient.met;
      newIngredient.classList.add("ingredients");
      const delBtn = document.createElement("button");
      delBtn.classList.add("squareBtn");
      // Agrega el botón dentro del nuevo ingrediente
      switch (delV) {
        case 1:
          createDelBtn(
            container,
            ingredients,
            newIngredient,
            index,
            "ingredients"
          );
          console.log("option 1");
          break;
        case 2:
          createDelBtn(container, ingredients, newIngredient, index, "groups");
          console.log("option 2");
          break;
        case 3:
          newIngredient.appendChild(delBtn);
          delBtn.textContent = "add";
          //Añadir ingrediente al producto seleccionado
          delBtn.addEventListener("click", function () {
            const ingredientToAdd = ingredientsList.find(
              (i) => i.name === ingredient.name
            );
            selectedProd.ingredients.push(ingredientToAdd);
            saveData("groups", groups);
            //actualizamos la lista del DOM que nos dice los ingredientes pertenecientes al producto
            printAllIngredients(
              document.querySelector(".prodIngredientsList"),
              selectedProd.ingredients,
              2
            );
          });
          console.log("option 3");
          break;
      }
      container.appendChild(newIngredient); // Agrega el nuevo ingrediente al contenedor actual
    });
  }

  //Funcion para cerrar todas las mesas
  document
    .querySelector("#closeAllTables")
    .addEventListener("click", function () {
      var ocupedTables = tables.filter((table) => table.ocuped === true);
      ocupedTables.forEach((ot) => {
        closeTable(ot, "---");
      });
    });

  document
    .querySelector("#changeBarName")
    .addEventListener("click", function () {
      barName = document.querySelector("#changeBarNameInput").value;
      setBarName();
      saveData("barName", barName);
    });

  //Funcion para establecer el nombre del bar
  function setBarName() {
    document.querySelectorAll(".barName").forEach((a) => {
      a.textContent = barName;
      console.log(barName);
    });
  }

  function setRootColors(color1, color2, color3, color4, color5, color6) {
    document.documentElement.style.setProperty("--mainColor", color1);
    document.documentElement.style.setProperty("--mainColor2", color2);
    document.documentElement.style.setProperty("--mainColor3", color3);
    document.documentElement.style.setProperty("--secondaryColor", color4);
    document.documentElement.style.setProperty("--main-bg-color", color5);
    document.documentElement.style.setProperty("--content", color6);
  }

  document.querySelector("#theme1").addEventListener("click", function () {
    setRootColors(
      "#E08268",
      "#81b29a",
      "#f4f1de",
      "#81b29a",
      "#f4f1de",
      "#212121"
    );
  });

  document.querySelector("#theme2").addEventListener("click", function () {
    setRootColors(
      "#e76f51",
      "#f4a261",
      "#2f5868",
      "#2a9d8f",
      "#264653",
      "#fff"
    );
  });

  document.querySelector("#gitBtn").addEventListener("click", function () {
    showNotification("aojasooahngojsjdsfjhASpoamfpaspfajsgf{p");
  });

  function showNotification(message) {
    const notificationText = document.querySelector("#notiText");
    var notification = document.getElementById("notification");
    notificationText.textContent = message;
    notification.style.top = "20px"; // Cambiamos la posición para que la notificación aparezca desde arriba
    setTimeout(function () {
      notification.style.top = "-100px"; // Después de un tiempo, volvemos a ocultar la notificación
    }, 3000); // Tiempo en milisegundos antes de ocultar la notificación
  }

  //------------------------------------- menuMagnament -------------------------->

  //Boton para testear ticket
  document.querySelector("#testTicket").addEventListener("click", function () {
    const items = [
      { name: "Example 1", price: 100 },
      { name: "Example 2", price: 50 },
      { name: "Example 1", price: 2.5 },
    ];
    const total = 152.5;
    const name = "ticketTest";

    createTicket(items, total, name);
  });

  //Personalizacion de tickets
  document
    .querySelector("#applyTicketsConfigs")
    .addEventListener("click", function () {
      customText1 = document.querySelector("#ct2").value;
      customText2 = document.querySelector("#ct1").value;
      fontWeightValue = parseFloat(document.querySelector("#fwv").value);
      fontSharpnessValue = parseFloat(document.querySelector("#fsv").value);
      var ticketDate = document.querySelector("#dateToggle").checked
        ? "block"
        : "none";
      localStorage.setItem("ticketDate", ticketDate);

      var ticketHour = document.querySelector("#hourToggle").checked
        ? "block"
        : "none";
      localStorage.setItem("ticketHour", ticketHour);

      localStorage.setItem("customText1", document.querySelector("#ct2").value);
      localStorage.setItem("customText2", document.querySelector("#ct1").value);
      localStorage.setItem(
        "fontWeightValue",
        parseFloat(document.querySelector("#fwv").value)
      );
      localStorage.setItem(
        "fontSharpnessValue",
        parseFloat(document.querySelector("#fsv").value)
      );
    });

  //Abrir y cerrar ventana de configuraciones
  document.querySelectorAll("#configBtn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const window = document.querySelector("#ConfigsWin");
      openCloseWindows(window);
      fillPaymentsMethodsSlct();
    });
  });

  //Venta desde caja/mostrador
  document.querySelectorAll("#cashierSell").forEach((btn) => {
    btn.addEventListener("click", function () {
      const window = document.querySelector("#mostradorWin");
      openCloseWindows(window);
      printMenuInTable(
        document.querySelector("#mostradorWin-gt"),
        document.querySelector("#mostradorWin-pb")
      );
      selectedTableJS = { name: 999, items: [] };
      preOrder = [];
      printPreorder(preOrder2, subTotal2);
    });
  });

  //Confirmar venta desde caja/mostrador
  document.querySelector("#confirmSell").addEventListener("click", function () {
    const window = document.querySelector("#mostradorWin");
    openCloseWindows(window);
    createTicket(preOrder, subTotal, "Venta desde caja");
    createTransaction(
      subTotal,
      "Venta desde caja",
      document.querySelector(".PM4").value
    );
    preOrder = [];
    showNotification(`Venta por caja realizada con exito por $${subTotal}`);
  });

  //Confirmar venta desde caja/mostrador
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
        showNotification("Error, seleccione una mesa");
      } else {
        const window = document.querySelector("#tableInventory");
        openCloseWindows(window);
        const groupTabs = document.querySelector(".groupsTabs");
        const productsConteiner = document.querySelector(".productButtons");
        printMenuInTable(groupTabs, productsConteiner);
        const preOrderItemsList = document.querySelector("#preOrderItemsList");
        const total = document.querySelector("#subTotal");
        printPreorder(preOrder1, subTotal1);
      }
    });
  });

  document.querySelectorAll("#close1").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (selectedTable === null) {
        showNotification("Error, seleccione una mesa");
      } else {
        const window = document.querySelector("#askCloseTable");
        openCloseWindows(window);
      }
    });
  });

  const configTabs = document.querySelectorAll("#configTabs");
  const configTabsBtn = document.querySelectorAll("#configTabsBtn");

  switchWindows(configTabs, configTabsBtn);

  const panelSalonbtns = document.querySelectorAll("#panelSalonbtn");
  const panelSalonWindows = document.querySelectorAll("#panelSalonPag");

  switchWindows(panelSalonWindows, panelSalonbtns);

  document.querySelectorAll("#openCloseSwap").forEach((btn) => {
    btn.addEventListener("click", function () {
      const window = document.querySelector("#swapTablesWin");
      openCloseWindows(window);
      const select = document.querySelectorAll("#tablesSlct");
      select.forEach((slct) => {
        slct.innerHTML = "";
        tables.forEach((table) => {
          const option = document.createElement("option");
          option.value = table.name;
          option.text = table.name + 1;
          slct.appendChild(option);
        });
      });
    });
  });

  document.querySelector("#doSwap").addEventListener("click", function () {
    const table1 = document.querySelector(".table1").value;
    const table2 = document.querySelector(".table2").value;
    swapTables(table1, table2);
  });

  //Funcion para intercambiar los inventarios de las mesas
  function swapTables(table1, table2) {
    const tempTable = tables[table2].items;
    tables[table2].items = tables[table1].items;
    tables[table1].items = tempTable;

    updateTableOccupancy(table1);
    updateTableOccupancy(table2);

    showNotification(
      `Se movio la mesa ${tables[table1].name + 1} a la mesa ${
        tables[table2].name + 1
      }`
    );

    printItemList(itemsList1);
  }

  function updateTableOccupancy(table) {
    const tableData = tables[table];
    const tableElement = document.getElementById(table);
    if (tableData.items.length === 0) {
      tableData.ocuped = false;
      tableElement.classList.remove("ocuped");
    } else {
      tableData.ocuped = true;
      tableElement.classList.add("ocuped");
    }
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
      console.log("La cantidad de pestañas y botones discrepa");
    }
  }

  //funcion para llenar todos los select con id #paymentsMethodsSlct con los metodos de pago
  function fillPaymentsMethodsSlct() {
    const selects = document.querySelectorAll("#paymentsMethodsSlct");
    selects.forEach((a) => {
      a.innerHTML = "";
    });
    paymentMethods.forEach((a) => {
      const newMethod = document.createElement("option");
      newMethod.textContent = a;
      newMethod.value = a;
      selects.forEach((select) => {
        select.appendChild(newMethod.cloneNode(true));
      });
    });
  }

  //--------------------StorageMagnament------------------------------>
  function saveData(itemName, dataTosave) {
    const stringifiedData = JSON.stringify(dataTosave);
    localStorage.setItem(itemName, stringifiedData);
  }

  function loadTables() {
    var tablesData = localStorage.getItem("tables");
    var tablesToPrint = JSON.parse(tablesData);
    tablesToPrint.forEach((table) => {
      if (table.position === "start") {
      } else {
        createTable(table.position);
      }
    });
    createTable("start");
  }

  function loadGroups() {
    var groupsData = localStorage.getItem("groups");
    var groupsToPrint = JSON.parse(groupsData);
    groups = groupsToPrint;
  }

  function loadIngredients(itemName, dataToRefresh) {
    var dataToLoad = localStorage.getItem(itemName);
    var parsedData = JSON.parse(dataToLoad);
    parsedData.forEach((e) => {
      ingredientsList.push(e);
      printAllIngredients(
        document.querySelector("#allIngrdients"),
        dataToRefresh,
        1
      );
    });
  }

  function loadPM(itemName, dataToRefresh) {
    var dataToLoad = localStorage.getItem(itemName);
    var parsedData = JSON.parse(dataToLoad);
    parsedData.forEach((e) => {
      dataToRefresh.push(e);
    });
  }

  function loadData(itemName) {
    var dataToLoad = localStorage.getItem(itemName);
    var parsedData = JSON.parse(dataToLoad);
    barName = parsedData;
    setBarName();
  }
});
