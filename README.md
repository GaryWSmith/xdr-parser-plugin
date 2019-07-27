# xdrParser-plugin
Signalk plugin to parse nmea0183 data

NMEA XDR messages are used to provide sensor data in the NMEA0183 format.

However, they are notoriously difficult to support because they are treated in an ad-hoc manner by many manufacturers and there is no standard with regards the naming of the sensors nor with regards the units of the data. 

XDR messages can contain multiple sensors within a single sentence or they might only have one sensor.

To overcome this ad-hoc approach, each sensor contained in XDR sentences must be defined in a dictionary. 

The xdrParser splits the incoming sentence into as many objects as there are sensors contained in the sentence.

It then matches the name(s) in the objects with the contents of the dictionary. 

If a match is found then an associated signalk path is assigned to the object and the data value is manipulated according to an associated mathematical expression also contained in the dictionary. This allows data contained in the sentence to be converted to SI units required by Signalk.

The objects are then used to generate SignalK delta objects - {path : "", values : ""];

The dictionary is in a JSON format, for example: 

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

The input data is received via configured data connections with type = NMEA0183 and which have a matching sentenceEvent name. The sentenceEvent name is set in the web user interface when creating data connections and in the plugin config.

The output of the plugin becomes another data source confirmed on the Dashboard under "Connection activity".

