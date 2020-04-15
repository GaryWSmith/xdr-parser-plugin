// XDR messages can contain information relating to multiple sensors:
// Each sensor's information is contained in quadruplets
// example xdr messages
//$IIXDR,C,28.7,C,ENV_OUTSIDE_T,P,101400,P,ENV_ATMOS_P,H,47.38,P,ENV_OUTSIDE_H*32
//$IIXDR,C,,C,ENV_WATER_T,C,28.69,C,ENV_OUTAIR_T,P,101400,P,ENV_ATMOS_P*69
//$IIXDR,C,28.69,C,ENV_OUTSIDE_T,P,101400,P,ENV_ATMOS_P,H,47.38,P,ENV_OUTSIDE_H*0A
//$IIXDR,H,47.38,P,ENV_OUTSIDE_H*30
//$IIXDR,P,101400,P,ENV_ATMOS_P*03



const m_hex = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']

function computeChecksum (sentence) { 		// from signalk-to-NMEA0183 plugin
  let i = 1;
  let c1 = sentence.charCodeAt(i);
  for (i = 2; i < sentence.length; ++i) {
    c1 = c1 ^ sentence.charCodeAt(i)
  }
  return '*' + toHexString(c1);
};

function toHexString (v) {  			// from signalk-to-NMEA0183 plugin
  let msn = (v >> 4) & 0x0f;
  let lsn = (v >> 0) & 0x0f;
  return m_hex[msn] + m_hex[lsn];
};

function isXDR (sentence) {
  if (sentence.substr(3,3) == "XDR")
    return true;
  else
    return false;
};

function chkSumOK (sentence) {
  var oldChkSum = sentence.substr(sentence.length-3, 3);
  var shrtStr = sentence.substr(0, sentence.length-3);
  var newChkSum = computeChecksum(shrtStr);
  return ( oldChkSum == newChkSum);
};

function getDataStr (sentence) {
  return sentence.substring(7, sentence.length - 3);
};

function getTalkerStr(sentence) {
  return sentence.substr(1,2);
};

function initObjArr(dataStr, talkerStr) { 	// create & initialise objArr from the XDR sentence  
  var xdrDataArr = dataStr.split(",");
  let xdrObjArr = [];
  for (let i=0; i < xdrDataArr.length; i+=4) {
    let xdrObj = { talker : "", name : "", data : "", expression : "", sk_path : ''};
    xdrObj.talker = talkerStr;
    xdrObj.name = xdrDataArr[i+3];
    xdrObj.data = xdrDataArr[i+1];
    xdrObjArr.push(xdrObj);
  }
  return xdrObjArr;
};

function fillObjArr(objArr, dictionary) {         // match & fill objArr with expression & sk_path values from dictionary 
var mexp = require('math-expression-evaluator');  // npm install math-expression-evaluator
  for (let j=0; j<objArr.length; j++) {
    for (let l=0; l<dictionary.definitions.length; l++)
      if (objArr[j].name == dictionary.definitions[l].name) {
        objArr[j].expression = dictionary.definitions[l].expression;
        objArr[j].sk_path = dictionary.definitions[l].sk_path;
        var expression = objArr[j].expression.replace(/x/g, objArr[j].data); 
        var value = mexp.eval(expression); 
        objArr[j].decimal = dictionary.definitions[l].decimal;
        var decimal = objArr[j].decimal;
        objArr[j].data = value.toFixed(decimal);			 // and update the sensor data based on the expression
        }
  }
};

let attitudeObj = {"roll" : 0, "pitch" : 0, "yaw" : 0};  // "rolling association only between elements of the attitude object"
function fillValueArr(objArr){
  let ValObjArr = [];
  for (let i=0; i < objArr.length; i++) {
    let skValObj = { "path" : "", "value" : ''};
    skValObj.path = objArr[i].sk_path;

    if (objArr[i].sk_path == "navigation.attitude") {
      if (objArr[i].name == "ROLL")
        attitudeObj.roll = objArr[i].data
      if (objArr[i].name == "PTCH")
        attitudeObj.pitch = objArr[i].data
      if (objArr[i].name == "YAW")
        attitudeObj.yaw = objArr[i].data
      skValObj.value = attitudeObj;
    }
    else {
      skValObj.value = objArr[i].data; 
    }
    if (skValObj.path != ''){
      ValObjArr.push(skValObj);
    }
  }
  return ValObjArr;
};

function generateDelta(objArr){
  let sourceObj = { "label": "XDR-Parser", "type": "NMEA0183", "talker": objArr[0].talker, "sentence": "XDR" };
  var skValArr = fillValueArr(objArr);
  if (skValArr == '')
    return null;
  let updatesArr = [{ "source" : sourceObj, "values" : skValArr}];    
  let skDeltaObj = {"updates" : updatesArr};   
  return skDeltaObj;
};

function processXDR(xdrStr, dictionary) { 
  xdrStr = xdrStr.trim();  
  if ( (isXDR(xdrStr)) && chkSumOK(xdrStr) ) {
    var dataStr = getDataStr(xdrStr);
    var talkerStr = getTalkerStr(xdrStr);
    var objArr = initObjArr(dataStr, talkerStr);
    fillObjArr(objArr, dictionary);
    return objArr;
  }
  else
    return null;
};

module.exports = function main(nmeaSentence, dictionary){
  if ((dictionary == null) || (nmeaSentence == null))
    return null;
  var objArr = processXDR(nmeaSentence, dictionary);      
    if (objArr != null){
      var skDelta = generateDelta(objArr);
      if (skDelta != null){					
        return (skDelta); 				   
      }
    }
  return null;
}
