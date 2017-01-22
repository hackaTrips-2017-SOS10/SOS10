//facilities del hotel
var hotelFacilities = '[{"code":1,"facilityGroupCode":63,"facilityTypologyCode":20,"description":{"content":"Single bed 90-130 width"}},{"code":1,"facilityGroupCode":62,"facilityTypologyCode":20,"description":{"content":"Single bed 90-130 width"}}]';
var jHotelFacilities= JSON.parse(hotelFacilities);


var mapHuellas = {"1-61-20": "4", "1-62-20" : "45"};
var huella = 0;

function getHuella(k){
  return mapHuellas[k];
}

	
for (var j in jHotelFacilities) {
	var code1 = jHotelFacilities[j].code;
	var facilityGroupCode1 = jHotelFacilities[j].facilityGroupCode;
	var facilityTypologyCode1 = jHotelFacilities[j].facilityTypologyCode;

	
	if(getHuella(code1 + "-" + facilityGroupCode1 + "-" + facilityTypologyCode1) != undefined) {	
		// console.log("code encontrado: " + code1 + "-" + facilityGroupCode1 + "-" + facilityTypologyCode1);
		huella = parseInt(huella) + parseInt(getHuella(code1 + "-" + facilityGroupCode1 + "-" + facilityTypologyCode1));
	}			
}


console.log('Huella encontrada: ' + huella);

