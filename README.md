# xdrParser-plugin
Signalk plugin to parse nmea0183 XDR data

NMEA XDR messages are used to provide sensor data in the NMEA0183 format.

They are awkard to support because they are treated in an ad-hoc manner by many manufacturers and there is no standard with regards the naming of the sensors nor with regards the units of the data. 

XDR sentences can contain multiple sensors within a single sentence or they might only have one sensor.

Examples of XDR sentences:
```$IIXDR,C,28.7,C,ENV_OUTSIDE_T,P,101400,P,ENV_ATMOS_P,H,47.38,P,ENV_OUTSIDE_H*32
$IIXDR,C,,C,ENV_WATER_T,C,28.69,C,ENV_OUTAIR_T,P,101400,P,ENV_ATMOS_P*69
$IIXDR,C,28.69,C,ENV_OUTSIDE_T,P,101400,P,ENV_ATMOS_P,H,47.38,P,ENV_OUTSIDE_H*0A
$IIXDR,H,47.38,P,ENV_OUTSIDE_H*30
$IIXDR,P,101400,P,ENV_ATMOS_P*03```

Each sensor's information is contained in quadruplets e.g. "C,  28.69  ,  C  ,  ENV_OUTAIR_T"

To overcome this somewhat ad-hoc approach, each sensors data which is contained in XDR sentences must be defined in a dictionary file/mechanism. In xdrParser-plugin the dictionary is built up within the Plugin Config functionality.

# Functionality
The xdrParser-plugin splits the incoming sentence into as many objects as there are sensors contained in the sentence.

It then matches the name in the object (the 4th field of the quadruple) with the contents of the dictionary. 

If a match is found then:
1) An associated signalk path is assigned to the object 
2) The data value is manipulated according to an associated mathematical expression also contained in the dictionary. This allows data contained in the sentence to be converted to SI units required by Signalk.
3) The modified data value is set in the object.

The objects are then used to generate SignalK delta objects - 
{path : "dictionary defined path", values : "manipulated value from sentence"]} 
	
Objects with an assigned path of "navigation.attitude" i.e. (Roll, Pitch and Yaw) receive special treatment as the navigation.attitude values are an object of roll, pitch and yaw values. For example:
	
	{
          "path": "navigation.attitude",
          "value": {
            "roll": -0.0581,
            "pitch": 0.345,
            "yaw": 0.0012
          }
        }
	
This is an example of the dictionary as it is stored internally: 

			{"type" : "WaterLevel",
			"data" : "volume",
			"units" : "%",
			"name" : "water#0",
			"expression" : "(x/225)", 
			"sk_path" : "tanks.freshWater.0.currentLevel" },

			{"type" : "FuelLevel",
			"data" : "volume",
			"units" : "l",
			"name" : "fuel#0",
			"expression" : "(x/300)",
			"sk_path" : "tanks.fuel.0.currentLevel" }


# Input Data
Configure a Data Connection.

The input data is received via an incoming data connection configured via the Server web UI. 
The data connection must be of type = NMEA0183. 
The "sentenceEvent" name is usually set to "nmea0183" so that the incoming nmea data is also sent to TCP 10110 by default. However any sentenceEvent name can be used so long as it matched within the Plugin Config of the xdrParser-plugin.
The "suppress0183event" value must be set to "false". 

(At the time of writing the TCP Client source type does not allow the setting of the "suppress0183event" and must be set to "false" in the servers "/~.signalk/settings.json" file.)

# Plugin Config
The first thing to do is provide the xdrParser-plugin with the details of the source of the XDR sentences. As mentioned above, the "sentenceEvent" name that was used in the incoming data connection configured previously must be set in the plugin.

The server plugin config functionality of the Web UI is also used to create a dictionary. In order to create viable dictionary entries, certain information must be known about the sensor(s) contained incoming XDR sentences. 

The minimum information is:

1) the "XDR sensor identifier" contained in the 4th field of each quadruple. For example "ENV_OUTAIR_T" is the identifier in this quadruple: "C,28.69,C,ENV_OUTAIR_T"

2) The units of the incoming data. Signalk uses SI units. A conversion must often be applied to incoming data. In order to do this a simple mathematical expression must be provided. In this example the incoming data in in Degrees Celcius. The conversion between Celcius and Kelvin (SI) is simply Celcius+273.15. Therefore the expression is "(x+273.15) - "x" representing the incoming data value which in this case is 28.69. The converted result of 301.83 is inserted into the data field. Similarly conversions from degrees to radians would have the expression (x*pi/180).

Some tank level systems output absolute volumes while Signalk requires a ratio of total volume (0.00 to 1.00). In this case the expression field would be used to calculate the ratio e.g. (x/225) In this example the total tank volume is 225 liters.

Where the data is to be passed through unmodified, the expression used would be (x*1) or (x/1).

3) In addition to having the sensor data information mentioned above at hand, you need to know which signal k path is applicable for that sensor data to be mapped to. For this information see the Signalk documentation. http://signalk.org/specification/1.0.0/doc/vesselsBranch.html

Once this is all complete and checked, click on the "Submit" button. 

# Output
The output of the plugin becomes just another data source to the server and confirmed on the Dashboard under "Connection activity".

A quick way to check the validity of the data and that is making it through to the Signalk server is use a browser.
Entering a url along the lines of the following in any modern browser should give you information pertinent your selected XDR input:

http://localhost:3000/signalk/v1/api/vessels/self/environment/outside/pressure

The fields after "self" should match the Signal k path that was set in your dictionary. For example "environment/outside/pressure" matches the Signalk path "environemnt.outside.pressure" 

The response in this example was:
	
```meta	
units		"Pa"
description	"Current outside air ambient pressure"
value		100900
$source		"xdrParser-plugin.II"
timestamp	"2019-07-31T21:29:10.924Z"
sentence	"XDR"
```
