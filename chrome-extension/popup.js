/*
d3
    .select("body")
    .append("svg")
    .attr("width", 50)
    .attr("height", 50)
    .append("circle")
    .attr("cx", 25)
    .attr("cy", 25)
    .attr("r", 25)
    .style("fill", "purple");
*/

var geoLat;
var geoLong;
var hotelNames = new Array();
var reqHotel;
var departureCity = 'Madrid';
var hotelName;
var hotelNameIndex = 0;

var respHotel;

function showHotel() {
    if (reqHotel.readyState == 4) {
        if (reqHotel.status == 200) {
            respHotel = JSON.parse(reqHotel.responseText);

            console.log(respHotel);

            mapHotelToUI(respHotel);
        } else {
            console.log('Error: ' + reqHotel.status);

            hotelNameIndex++;

            if (hotelNameIndex < hotelNames.length) {

                setTimeout(tryNextHotel, 1000);

            } else {

                respHotel = {
                    "hotelName": "WL Windsor Luxury",
                    "photoURL": "http://photo-hotels.com/hotel.jpg",
                    "co2footprint": 6.7,
                    "co2footprintCategory": 2,
                    "flightco2footprint": 789.2,
                    "departureCity": "Madrid",
                    "arrivalCity": "Mexico D.F.",
                    "flightDistanceInKms": 5690,
                    "alternativeHotels": [
                        {
                            "hotelName": "Other Hotel 1",
                            "photoUrl": "http://photo-hotels.com/hotel1.jpg",
                            "lat": 40.783,
                            "lon": 120.234,
                            "co2footprint": 5.2,
                            "co2footprintCategory": 4
                        },
                        {
                            "hotelName": "Other Hotel 2",
                            "photoUrl": "http://photo-hotels.com/hotel2.jpg",
                            "lat": -23.783,
                            "lon": -34.234,
                            "co2footprint": 9,
                            "co2footprintCategory": 0
                        },
                        {
                            "hotelName": "Other Hotel 3",
                            "photoUrl": "http://photo-hotels.com/hotel3.jpg",
                            "lat": 150.23,
                            "lon": -45.23,
                            "co2footprint": 2,
                            "co2footprintCategory": 5
                        },
                    ]
                };
                mapHotelToUI(respHotel);
            }
        }
    }
}

function checkPageProcessed() {
    console.log("Checking page processed");
    if (hotelNames.length > 0) {
        clearInterval(checkPageProcessedInterval);
        if (typeof(geoLat) != 'undefined') {
            clearInterval(checkGeoInterval);
            tryNextHotel();
        }
    }
}

function checkGeo() {
    console.log("Checking geo");
    if (typeof(geoLat) != 'undefined') {
        clearInterval(checkGeoInterval);
        if (hotelNames.length > 0) {
            clearInterval(checkPageProcessedInterval);
            tryNextHotel();
        }
    }
}

var checkGeoInterval = setInterval(checkGeo, 500);
var checkPageProcessedInterval = setInterval(checkPageProcessed, 500);

var geoSuccess = function(position) {

    // Do magic with location
    startPos = position;
    geoLat = startPos.coords.latitude;
    geoLong = startPos.coords.longitude;
};

function tryNextHotel() {

    retrieveHotel(hotelNames[hotelNameIndex]);
}

function retrieveHotel(hotelName) {
//    alert("Calling api");

    reqHotel = new XMLHttpRequest();
    reqHotel.onreadystatechange = showHotel;

    //var url = 'http://private-744b35-sos10api.apiary-mock.com/tst/';
    var url = 'https://sos10.azurewebsites.net/api/HttpTriggerJS1?code=q1MoaiMxS/4XaGDAu7DgHm7wNS2cgGm/UQ3HxsyYrDLtclwBjAfcCw==';

    url = url + '&hotelName=';
    url = url + hotelName;
    url = url + '&departureCity=';
    url = url + departureCity;
    url = url + '&departureLat=';
    url = url + geoLat;
    url = url + '&departureLon=';
    url = url + geoLong;

    console.log('Calling ' + url);

    reqHotel.open('GET', url, true);
    reqHotel.send(null);
};

$('#sos10Box').click(function(evt) {
    window.close();
});

navigator.geolocation.getCurrentPosition(geoSuccess, null);

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
      analyzeContent(request.source);
  }
});

function onWindowLoad() {

  var message = document.querySelector('#message');

  chrome.tabs.executeScript(null, {
    file: "getPagesSource.js"
  }, function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
      if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError.message);
        message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
    }
  });

}

Number.prototype.formatDouble = function(c, d, t) {
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "," : d,
        t = t == undefined ? "." : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;

    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

function formatDouble(value) {
    var d = parseFloat(value);
    return d.formatDouble();
}

function mapHotelToUI(hotelInfo) {
    $('#sos10').toggleClass('level2');
    $('#sos10').toggleClass('level' + hotelInfo.co2footprintCategory);
    $('.hotelName').text(hotelInfo.hotelName);
    $('#co2footprint').text(hotelInfo.co2footprint);
    $('#departureCity').text(hotelInfo.departureCity);
    $('#arrivalCity').text(hotelInfo.arrivalCity);
    $('#flightDistanceInKms').text(formatDouble(hotelInfo.flightDistanceInKms));
    $('#flightco2footprint').text(formatDouble(hotelInfo.flightco2footprint));
    $('#alternateHotelCount').prepend(hotelInfo.alternativeHotels.length);

    var alternateHotelList = $('#alternateHotels');

    for (i = 0; i < hotelInfo.alternativeHotels.length; i++) {
        var alternateHotel = hotelInfo.alternativeHotels[i];

        alternateHotelList.append('<li class="level' + alternateHotel.co2footprintCategory + '"><a href="#"><span>' + alternateHotel.co2footprint + '</span> ' + alternateHotel.hotelName + '</a></li>');
    }
}

var reqTextAnalysis = new XMLHttpRequest();

function processKeywords() {
    if (reqTextAnalysis.readyState == 4) {
        if (reqTextAnalysis.status == 200) {
            respTextAnalysis = JSON.parse(reqTextAnalysis.responseText);

            console.log(respTextAnalysis);
        } else {
            console.log('Error: ' + reqTextAnalysis.status);
        }

        analyzeKeywords(respTextAnalysis);
    }
}

reqTextAnalysis.onreadystatechange = processKeywords;

var respTextAnalysis;

function analyzeContent(content) {

    var parser = new DOMParser();
    var doc = parser.parseFromString(content, "text/html");

    var paragraphs = doc.getElementsByTagName('p');
    console.log(paragraphs);

    var documents = new Array();

    for (var i = 0; i < paragraphs.length; i++) {
        var content = paragraphs[i].innerHTML.replace(/<[^>]*>/g, "");
        content = content.substring(0, Math.min(content.length, 10000/paragraphs.length));
        if (/[hH]otel /.test(content)) {
            var d = {
                "language": "en",
                "id": "" + i,
                "text": content
            };

            documents.push(d);
            console.log(d);
        }
    }

    var textAnalysisUrl = 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases';

    console.log("Calling " + textAnalysisUrl);
    
    var textAnalysisInput = { "documents" : documents };

//    console.log(JSON.stringify(textAnalysisInput));

    reqTextAnalysis.open('POST', textAnalysisUrl);
    reqTextAnalysis.setRequestHeader("Accept", "application/json");
    reqTextAnalysis.setRequestHeader("Ocp-Apim-Subscription-Key", "01dc9842484049cf9e894df43602c2a5");
    reqTextAnalysis.setRequestHeader("Content-Type", "application/json");

    reqTextAnalysis.send(JSON.stringify(textAnalysisInput));
}

function analyzeKeywords(keywords) {

    if (typeof(keywords) != 'undefined') {

        var documents = keywords.documents;

        console.log(documents);

        for (var i = 0; i < documents.length; i++) {
            var d = documents[i];
            var keyPhrases = d.keyPhrases;
            for (var j = 0; j < keyPhrases.length; j++) {
                if (/[hH]otel /.test(keyPhrases[j])) {
                    hotelName = keyPhrases[j].replace(/^[eE]l [hH]otel /g, "").replace(/^[hH]otel /g, "").replace(/ es .*/g, "");
                    if (hotelNames.indexOf(hotelName) > -1) {
                        console.log("Found hotel candidate: " + hotelName);                    
                        hotelNames.push(hotelName);
                    }
                }
            }
        }
    } else {
        console.log("No page keywords available");
    }
}
window.onload = onWindowLoad;


