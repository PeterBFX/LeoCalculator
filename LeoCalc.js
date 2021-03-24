"use strict"

//Set authToken with value from https://www.bitfinex.com/_ws_token while in context switch

const authToken = {"token":"pub:api:kAArN5MlHf0FEvJ8j2j3cljdjcSvUucD-caps:o:f:w:s-read"}

//Get VWAP data

const fetch = require('node-fetch')
const url = 'https://api-pub.bitfinex.com/v2/'

const pathParams = 'stats1/vwap:1d:tLEOUST/hist' // Change these based on relevant path params. Use /last for last
const queryParams = 'limit=30' // Change these based on relevant query params

async function requestVWAP() {
    try {
        const req = await fetch(`${url}/${pathParams}?${queryParams}`)
        const response = await req.json()
        return response
    }
    catch (err) {
        console.log(err)
    }
}

//Get Auth data

async function getAuthData(path, body) {
    const data = await fetch (`https://api.bitfinex.com/${path}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'bfx-token': authToken.token
            }
        })
    const dataJSON = await data.json()
    return dataJSON
}

//Get LEO snapshot

async function getLeoSnapshotsData(timeStamp) {

    const leoSnapPath = 'v2/auth/r/ledgers/LEO/hist'

    const body = {
        limit: 1,
        end: timeStamp
    }

    const leoSnapJSON = await getAuthData(leoSnapPath, body)
    return leoSnapJSON
}

//Get user info

async function getUserInfo() {
    
    const userDataPath = 'v2/auth/r/info/user'
    const body = {}

    const userDataJSON = await getAuthData(userDataPath, body)
    return userDataJSON
}

//Get account summary

async function getSummaryData() {

    const summaryPath = 'v2/auth/r/summary'
    const body = {}

    const summaryDataJSON = await getAuthData(summaryPath, body)
    return summaryDataJSON
}

//Build and print LEO snapshot report

async function buildLeoReport(){

    const VWAPdata = await requestVWAP();
    const userInfo = await getUserInfo();
    const accountSummary = await getSummaryData();
    const userName = userInfo[2];
    const userId = userInfo[0];
    const leoSummary = accountSummary[9]
    let balanceSnap
    let usdtEquiv
    let dataToAdd = {}
    let leoTable = []
    let usdtEquivSum = 0
    let usdtEquivAverage = 0

    try{
        for(let i = 0; i < 30; i++) {
            let timeStamp = VWAPdata[i][0]
            let leoSnapPrice = VWAPdata[i][1]
            let dateObject = new Date(timeStamp)
            let date = dateObject.toUTCString()
            let leoData = await getLeoSnapshotsData(timeStamp)
            if(leoData.length === 0)
                {
                balanceSnap = 0
                usdtEquiv = 0
                dataToAdd = {"Timestamp": timeStamp, "Date": date, "VWAP": leoSnapPrice, "Balance Snapshot": balanceSnap, "USDt Equivalent": usdtEquiv}
                leoTable.push(dataToAdd)
                } 
            else {
                balanceSnap = leoData[0][6]
                usdtEquiv = balanceSnap * leoSnapPrice
                dataToAdd = {"Timestamp": timeStamp, "Date": date, "VWAP": leoSnapPrice, "Balance Snapshot": balanceSnap, "USDt Equivalent": usdtEquiv}
                usdtEquivSum = usdtEquivSum + usdtEquiv
                leoTable.push(dataToAdd)
            }
        }
    }
    catch (err) {
        console.log(err)
    }

    usdtEquivAverage = usdtEquivSum / 30
    console.log(leoTable)
    console.log(`Username: ${userName} UserID: ${userId}`)
    console.log("LEO Summary Data: ", leoSummary)
    console.log(`Sum of USDt Equivalents: ${usdtEquivSum}`)
    console.log(`30 Day Average USDT Equivalent: ${usdtEquivAverage}`)
}

buildLeoReport()
