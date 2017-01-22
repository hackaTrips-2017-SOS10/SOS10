var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var CryptoJS = require("crypto-js");
var geolib = require("geolib");

let apiKey = 'efpykyafrw7yryhs2pd7jc8p';
let secret = 'n6uTJfzRRD';
let hotelBedsPhotosBaseUrl = 'http://photos.hotelbeds.com/giata/bigger/';
let hotelBedsIds = { 'Windsor Luxury' : 1 };
let hotelDetailEndpointUrl = 'https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels/';
let hotelsByDestinationEndpointUrl = 'https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?fields=name%2Cimages%2Ccoordinates%2Cfacilities&language=ENG&from=1&to=10&destinationCode=';
let longDistanceCO2PerKm = 113;
let shortDistanceCO2PerKm= 257;
let shortDistanceFlightThreshold = 463;

var departureCity, departureLon, departureLat;

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed.');

    let hotelName = req.query.hotelName;
    departureCity = req.query.departureCity;
    departureLat = req.query.departureLat;
    departureLon = req.query.departureLon;

    if (hotelName && departureCity && departureLat && departureLon) {
        context.log("Querying tourism sustainable targets for hotel " + hotelName);
        let hotelId = mapHotelNameToHotelId(hotelName);
        hotelContentsFromId(
            hotelId,
            onHotelContents(context),
            onError(context));
    }
    else {
        res = {
            status: 400,
            body: "Please pass your travel's departure city, latitude, longitude and a hotel name"
        };
        context.done(null, res);
    }
}

function onHotelContents(context) {
    return function(hotelContents) {
        context.log(hotelContents);
        calculateHotelDatasheet(
            JSON.parse(hotelContents),
            function(hotelDatasheet) {
                res = {
                    body: hotelDatasheet
                };
                context.done(null, res);
            });
    };
}

function onError(context) {
    return function(error) {
        res = {
            status: 500,
            body: "Server error: " + error
        };
        context.done(null, res);
    };
}

function mapHotelNameToHotelId(hotelName) {
    return hotelBedsIds[hotelName];
}

function hotelContentsFromId(hotelId, successCallback, errorCallback) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', hotelDetailEndpointUrl + hotelId, true);
    setHotelBedsRequestHeadersOn(xhr);

    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                successCallback(xhr.responseText);
            } else {
                errorCallback(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        errorCallback(xhr.statusText);
    };
    xhr.send(null);

}

function setHotelBedsRequestHeadersOn(request) {
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Accept', 'application/json');
    request.setRequestHeader('Api-key', apiKey);
    request.setRequestHeader('X-Signature', hotelBedsSignature());
}

function hotelBedsSignature() {

    var utcDate = Math.floor(new Date().getTime() / 1000);
    var assemble = (apiKey + secret + utcDate);
    var hash = CryptoJS.SHA256(assemble).toString();
    var signature = (hash.toString(CryptoJS.enc.Hex));
    return signature;

}

function alternativeHotelsAtSameDestination(destinationCode, successCallback, errorCallback) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', hotelsByDestinationEndpointUrl + destinationCode, true);
    setHotelBedsRequestHeadersOn(xhr);

    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                successCallback(xhr.responseText);
            } else {
                errorCallback(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        errorCallback(xhr.statusText);
    };
    xhr.send(null);

}

function onAlternativeHotels(excludedHotelName, hotelsResponseText) {
    let hotelsResponse = JSON.parse(hotelsResponseText);
    let filteredHotels = hotelsResponse.hotels.filter(function(hotel) {
        return hotel.name.content !== excludedHotelName;
    });
    var alternatives = filteredHotels.map(function(hotel) {
        var footprint = calculateCO2Footprint(hotel.facilities);
        return {
            "hotelName": hotel.name.content,
            "photoUrl": hotelBedsPhotosBaseUrl + hotel.images[0].path,
            "lat":  hotel.coordinates.latitude,
            "lon":  hotel.coordinates.longitude,
            "co2footprint": footprint,
            "co2footprintCategory": footprintToCategory(footprint)
        };
    });
    return alternatives;
}

function onAlternativeHotelsError(error) {
    // do nothing
}

function hotelBedsSignature() {

    var utcDate = Math.floor(new Date().getTime() / 1000);
    var assemble = (apiKey + secret + utcDate);
    var hash = CryptoJS.SHA256(assemble).toString();
    var signature = (hash.toString(CryptoJS.enc.Hex));
    return signature;

}

function calculateHotelDatasheet(hotelContents, successCallback) {

    let hotel = hotelContents.hotel;

    var onHotelContentsAndAlternatives = function (alternativeHotels) {
        let co2footprint = calculateCO2Footprint(hotel.facilities);
        let flightDistance = distance(
            {latitude: departureLat, longitude: departureLon},
            {latitude: hotel.coordinates.latitude, longitude: hotel.coordinates.longitude}
        );
        var hotelDatasheet = {
            "hotelName": hotel.name.content,
            "photoURL": hotelBedsPhotosBaseUrl + hotel.images[0].path,
            "lat": hotel.coordinates.latitude,
            "lon": hotel.coordinates.longitude,
            "co2footprint": co2footprint,
            "co2footprintCategory": footprintToCategory(co2footprint),
            "departureCity": departureCity,
            "arrivalCity": hotel.zone.name,
            "flightDistanceInKms": flightDistance,
            "flightco2footprint": calculateFlightsCO2Footprint(flightDistance),
            "alternativeHotels": alternativeHotels
        };
        successCallback(hotelDatasheet);
    };

    alternativeHotelsAtSameDestination(
        hotel.destination.code,
        function(responseText) {
            var alternativeHotels = onAlternativeHotels(hotel.name.content, responseText);
            onHotelContentsAndAlternatives(alternativeHotels);
        },
        function(error) {
            var alternativeHotels = [];
            onHotelContentsAndAlternatives(alternativeHotels);
        });

}

function calculateCO2Footprint(hotelFacilities) {
    return 9.2;
}

function footprintToCategory(co2footprint) {
    var category = 0;
    switch (co2footprint) {
        case (co2footprint < 3):
            category = 0;
            break;
        case (co2footprint < 5):
            category = 1;
            break;
        case (co2footprint < 7):
            category = 2;
            break;
        case (co2footprint < 9):
            category = 3;
            break;
        case (co2footprint < 12):
            category = 4;
            break;
        default:
            category = 5;
    }
    return category;
}

function distance(point1, point2) {
    return geolib.convertUnit('km', geolib.getDistance(point1, point2), 2);
}

function calculateFlightsCO2Footprint(distanceInKms) {
    let footprintPerKm = (distanceInKms < shortDistanceFlightThreshold) ? shortDistanceCO2PerKm : longDistanceCO2PerKm;
    return Math.round(((2 * footprintPerKm * distanceInKms) / 1000) * 100) / 100;
}
