const axios = require('axios');
const input = (question) => require('readline-sync').question(question);
let appId = input("App game link: ");
appId = appId.substring(appId.indexOf('/app/') + 5, appId.indexOf('/', appId.indexOf('/app/') + 5));
async function getGameDetails(appId) {
    const gameData = (await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`)).data[appId].data;
    const reviewData = (await axios.get(`https://store.steampowered.com/appreviews/${appId}?json=1&purchase_type=steam&language=all`)).data.query_summary
    return {
        price: gameData.price_overview?.initial / 100,
        releaseDate: gameData.release_date.date.substring(gameData.release_date.date.indexOf(', ')+2),
        totalReviews: reviewData.total_reviews,
        reviewScore: Math.floor((reviewData.total_positive / reviewData.total_reviews) * 100)
    };
}   
async function main() {
    const { price, releaseDate, totalReviews, reviewScore } = await getGameDetails(appId)
    estimateRevenue(price, releaseDate, totalReviews, reviewScore)
}

function deductPercentage(number, percentage){
    return number - (number * (percentage / 100))
}

function estimateRevenue(price, releaseDate, totalReviews, reviewScore){
    const discountPercentageRatio = 50
    let releaseDateRatio
    let reviewScoreRatio
    switch(releaseDate){
        case 2013:
            releaseDateRatio = 90
            break;
        case 2014:
            releaseDateRatio = 80
            break;
        case 2015:
            releaseDateRatio = 70
            break;
        case 2016:
            releaseDateRatio = 60
            break;
        case 2017:
            releaseDateRatio = 50
            break;
        case 2018:
            releaseDateRatio = 40
            break;
        case 2019:
            releaseDateRatio = 30
        default:
            if (releaseDate <= 2012){
                releaseDateRatio = 90
            }
            else if (releaseDate >= 2019){
                releaseDateRatio = 30
            }
    }
    if (reviewScore <= 30){
        reviewScoreRatio = 30
    }
    else if (reviewScore <= 50){
        reviewScoreRatio = 40
    }
    else if (reviewScore <= 90){
        reviewScoreRatio = 50
    }
    else{
        reviewScoreRatio = 20
    }
    const ratio = Math.round((6 * releaseDateRatio + 3 * reviewScoreRatio + discountPercentageRatio) / 10)
    const sales = Math.round(totalReviews * ratio)
    const gross_revenue = Math.round(sales * price)
    let net_revenue = (deductPercentage(sales, 30) * deductPercentage(price, 50)) + (deductPercentage(sales, 70) * price) // DISCOUNT
    net_revenue = deductPercentage(net_revenue, 15) // VAT / SALES TAX
    net_revenue = Math.round(deductPercentage(net_revenue, 30)) // STEAM CUT
    console.log("Estimated sales to review ratio: " + ratio)
    console.log("Estimated sales: " + sales.toLocaleString())
    console.log("Estimated gross revenue: $" + gross_revenue.toLocaleString());

    console.log("Estimated net revenue: $" + net_revenue.toLocaleString())
}
main();