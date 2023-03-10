"use strict";

const state = {
    receiveDateElement: null,
    amountInUsdElement: null,
    conversionDateElement: null,
    conversionRateElement: null,
    conversionRateApiLinkElement: null,
    amountInReaisElement: null,
    generatedTextElement: null,
};

window.onload = function() {
    state.receiveDateElement = document.getElementById("receiveDate");
    state.amountInUsdElement = document.getElementById("amountInUsd");
    state.conversionDateElement = document.getElementById("conversionDate");
    state.conversionRateElement = document.getElementById("conversionRate");
    state.conversionRateApiLinkElement = document.getElementById("apiLink");
    state.amountInReaisElement = document.getElementById("amountInReais");
    state.generatedTextElement = document.getElementById("generated");

    let pastMonth = new Date();
    pastMonth.setDate(15);
    pastMonth.setMonth(pastMonth.getMonth() - 1);

    state.receiveDateElement.valueAsDate = pastMonth;
    onGenerateButtonClicked();

    document.getElementById("generate").onclick = onGenerateButtonClicked;
};

function formatFinancialNumber(n, maxFracDigits) {
    let formatted = n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: maxFracDigits });
    return formatted;
}

async function onGenerateButtonClicked() {
    let date = state.receiveDateElement.valueAsDate;
    date.setDate(15);
    date.setMonth(date.getMonth() - 1);

    let conversionRate = 0.0;

    const maxTryCount = 10;
    let tryCount = 0;
    while (tryCount < maxTryCount) {
        while (true) {
            let weekDay = date.getDay();
            let isWeekend = weekDay == 0 || weekDay == 6;
            if (!isWeekend) {
                break;
            }
            date.setDate(date.getDate() - 1);
        }

        {
            let day = date.getDate().toLocaleString("pt-BR", { minimumIntegerDigits: 2 });
            let month = (date.getMonth() + 1).toLocaleString("pt-BR", { minimumIntegerDigits: 2 });
            let year = date.getFullYear();

            let url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=%27${month}-${day}-${year}%27&$format=json&$select=cotacaoCompra`;
            let response = await fetch(url);
            let responseText = await response.text();
            let responseJson = JSON.parse(responseText);

            let rates = responseJson.value[0];
            if (rates != null) {
                state.conversionRateApiLinkElement.setAttribute("href", url);
                conversionRate = rates.cotacaoCompra;
                break;
            }

            date.setDate(date.getDate() - 1);
        }

        tryCount += 1;
    }
    if (tryCount >= maxTryCount) {
        console.error("could not fetch conversion rate");
    }

    let amountInUsd = state.amountInUsdElement.value.replace(".", "").replace(",", ".");
    amountInUsd = parseFloat(amountInUsd);
    if (isNaN(amountInUsd)) {
        amountInUsd = 0.0;
    }

    state.conversionDateElement.valueAsDate = date;

    let conversionRateFormatted = formatFinancialNumber(conversionRate, 4);
    state.conversionRateElement.value = conversionRateFormatted;

    let amountInReais = amountInUsd * conversionRate;
    state.amountInReaisElement.value = formatFinancialNumber(amountInReais, 2);

    let amountInUsdFormatted = formatFinancialNumber(amountInUsd, 2);

    let dateLocale = date.toLocaleDateString("pt-BR");
    let generatedText =
        "Recebimento de sal??rio referente a trabalho para empresa estrangeira BIT CAKE STUDIO OU, localizada na Est??nia. " +
        `Valor em USD: \$${amountInUsdFormatted}. C??mbio utilizado: ${conversionRate}, segundo a taxa de compra do Banco Central em ${dateLocale}`;
    state.generatedTextElement.value = generatedText;
}
