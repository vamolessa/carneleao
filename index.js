"use strict";

const state = {
    receiveDateElement: null,
    amountInUsdElement: null,
    conversionRateElement: null,
    amountInReaisElement: null,
    generatedTextElement: null,
};

window.onload = function() {
    state.receiveDateElement = document.getElementById("receiveDate");
    state.amountInUsdElement = document.getElementById("amountInUsd");
    state.conversionRateElement = document.getElementById("conversionRate");
    state.amountInReaisElement = document.getElementById("amountInReais");
    state.generatedTextElement = document.getElementById("generated");

    state.receiveDateElement.valueAsDate = new Date();
    onGenerateButtonClicked();

    document.getElementById("generate").onclick = onGenerateButtonClicked;
};

function formatFinancialNumber(n, maxFracDigits) {
    let formatted = n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: maxFracDigits });
    return formatted;
}

async function onGenerateButtonClicked() {
    let date = state.receiveDateElement.valueAsDate;

    let conversionRate = 0.0;
    {
        let day = date.getDate().toLocaleString("pt-BR", { minimumIntegerDigits: 2 });
        let month = (date.getMonth() + 1).toLocaleString("pt-BR", { minimumIntegerDigits: 2 });
        let year = date.getFullYear();

        let url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=%27${month}-${day}-${year}%27&$format=json&$select=cotacaoCompra`;
        let response = await fetch(url);
        let json = await response.json();

        let rates = json.value[0];
        if (rates != null) {
            conversionRate = rates.cotacaoCompra;
        }
    }

    let amountInUsd = state.amountInUsdElement.value.replace(".", "").replace(",", ".");
    amountInUsd = parseFloat(amountInUsd);
    if (isNaN(amountInUsd)) {
        amountInUsd = 0.0;
    }

    let conversionRateFormatted = formatFinancialNumber(conversionRate, 4);
    state.conversionRateElement.value = conversionRateFormatted;

    let amountInReais = amountInUsd * conversionRate;
    state.amountInReaisElement.value = formatFinancialNumber(amountInReais, 2);

    let amountInUsdFormatted = formatFinancialNumber(amountInUsd, 2);

    let dateLocale = date.toLocaleDateString("pt-BR");
    state.generatedTextElement.textContent =
        "Recebimento de salário referente a trabalho para empresa estrangeira BIT CAKE STUDIO OU, localizada na Estonia. " +
        `Valor em USD: \$${amountInUsd}. Câmbio utilizado: ${dateLocale}, segundo a taxa de compra do Banco Central: ${conversionRate}`;
}
