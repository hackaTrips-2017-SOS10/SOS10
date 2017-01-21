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

var req = new XMLHttpRequest();

req.onreadystatechange = showHotel;

var resp;

function showHotel() {
    if (req.readyState == 4) {
        if (req.status == 200) {
            resp = JSON.parse(req.responseText);
            console.log(resp);
        } else {
            console.log('Error: ' + req.status);
        }
    }
}

function checkGeo() {
    if (geoLat !== 'undefined') {
        clearTimeout(checkGeo);
        retrieveHotel(showHotel);
    }
}

setTimeout(checkGeo, 500);

var geoSuccess = function(position) {

    // Do magic with location
    startPos = position;
    geoLat = startPos.coords.latitude;
    geoLong = startPos.coords.longitude;

    retrieveHotel();
}

function retrieveHotel() {
    alert("Calling api");

    var hotelName = 'Windsor Luxury';
    var departureCity = 'Madrid';
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

    //alert('Calling ' + url);

    req.open('GET', url, true);
    req.send(null);
};

$('#sos10Box').click(function(evt) {
    window.close();
});

navigator.geolocation.getCurrentPosition(geoSuccess, null);
