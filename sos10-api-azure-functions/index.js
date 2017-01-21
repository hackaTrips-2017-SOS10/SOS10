var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var CryptoJS = require("crypto-js");
var geolib = require("geolib");

let apiKey = 'efpykyafrw7yryhs2pd7jc8p';
let secret = 'n6uTJfzRRD';
let hotelBedsPhotosBaseUrl = 'http://photos.hotelbeds.com/giata/bigger/';
var departureCity, departureLon, departureLat;

module.exports = function (context, req) {
		context.log('JavaScript HTTP trigger function processed.');

		let hotelName = req.query.hotelName;
		departureCity = req.query.departureCity;
		departureLat = req.query.departureLat;
		departureLon = req.query.departureLon;

		if (hotelName && departureCity && departureLat && departureLon) {
				context.log("Received query by hotelName " + hotelName);
				let hotelId = mapHotelNameToHotelId(hotelName);
				hotelContentsFromId(
						hotelId,
						onHotelContents(context),
						onError(context));
		}
		else {
				res = {
						status: 400,
						body: "Please pass your travel's departure city and hotel name"
				};
				context.done(null, res);
		}
}

function onHotelContents(context) {
		return function(hotelContents) {
				context.log(hotelContents);
				let hotelTNTs = calculateHotelTNTs(JSON.parse(hotelContents));
				res = {
						body: hotelTNTs
				};
				context.done(null, res);
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
		var hotelBedsIds = { 'Windsor Luxury' : 1 };
		return hotelBedsIds[hotelName];
}

function hotelContentsFromId(hotelId, successCallback, errorCallback) {

		let hotelDetailEndpointUrl = 'https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels/';

		var xhr = new XMLHttpRequest();
		xhr.open('GET', hotelDetailEndpointUrl + hotelId, true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.setRequestHeader('Accept', 'application/json');
		xhr.setRequestHeader('Api-key', apiKey);
		xhr.setRequestHeader('X-Signature', hotelBedsSignature());

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

function hotelBedsSignature() {

		//Begin UTC creation
		var utcDate = Math.floor(new Date().getTime() / 1000);

		//Begin Signature Assembly
		var assemble = (apiKey + secret + utcDate);

		//Begin SHA-256 Encryption
		hash = CryptoJS.SHA256(assemble).toString();
		encryption = (hash.toString(CryptoJS.enc.Hex));
		return encryption;

}

function calculateHotelTNTs(hotelContents) {
		let hotel = hotelContents.hotel;
		let co2footprint = calculateCO2Footprint(hotel.facilities);
		let flightDistance = distance(
				{latitude: departureLat, longitude: departureLon},
				{latitude: hotel.coordinates.latitude, longitude: hotel.coordinates.longitude}
		);

		return {
				"hotelName": hotel.name.content,
				"photoURL": hotelBedsPhotosBaseUrl + hotel.images[0].path,
				"lat": hotel.coordinates.latitude,
				"lon": hotel.coordinates.longitude,
				"co2footprint": co2footprint,
				"co2footprintCategory": calculateCO2FootprintCategory(co2footprint),
				"departureCity": departureCity,
				"arrivalCity": hotel.zone.name,
				"flightDistanceInKms": flightDistance,
				"flightco2footprint": calculateFlightsCO2Footprint(flightDistance),
				"alternativeHotels": []
		};
}

function calculateCO2Footprint(hotelFacilities) {
		return 9.2;
}

function calculateCO2FootprintCategory(co2footprint) {
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

let longDistanceCO2PerKm = 113;
let shortDistanceCO2PerKm= 257;

function calculateFlightsCO2Footprint(distanceInKms) {
		let footprintPerKm = (distanceInKms < 463) ? shortDistanceCO2PerKm : longDistanceCO2PerKm;
		return Math.round(((2 * footprintPerKm * distanceInKms) / 1000) * 100) / 100;
}
