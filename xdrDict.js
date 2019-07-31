// this file is not used by the plugin, but may be used to manually populate the xdrParser-plugin.json file in 
// the .signalk/plugin-config-data directory.

{ "definitions" : [	{"type" : "Air temperature",
			"data" : "temperature",
			"units" : "C",
			"name" : "ENV_OUTAIR_T",
			"expression" : "(x+273.15)",
			"sk_path" : "environment.outside.temperature" },

			{"type" : "WaterLevel",
			"data" : "volume",
			"units" : "%",
			"name" : "water#0",
			"expression" : "(x/225)", 
			"sk_path" : "tanks.freshWater.main.currentLevel" },

			{"type" : "FuelLevel",
			"data" : "volume",
			"units" : "l",
			"name" : "fuel#0",
			"expression" : "(x/300)",
			"sk_path" : "tanks.fuel.main.currentLevel" },

			{"type" : "Outside temperature",
			"data" : "temperature",
			"units" : "C",
			"name" : "ENV_OUTSIDE_T", 
			"expression" : "(x+273.15)",
			"sk_path" : "environment.outside.temperature" },

			{"type" : "Outside pressure",
			"data" : "pressure",
			"units" : "Pa",
			"name" : "ENV_ATMOS_P",
			"expression" : "(x*1)",
			"sk_path" : "environment.outside.pressure" },

			{"type" : "Outside humidity",
			"data" : "humidity",
			"units" : "%",
			"name" : "ENV_OUTSIDE_H",
			"expression" : "(x/100)",
			"sk_path" : "environment.outside.humidity" },

			{"type" : "Pitch",
			"data" : "Angles",
			"units" : "Deg",
			"name" : "PTCH",
			"expression" : "(x*pi/180)",
			"sk_path" : "navigation.attitude" },

			{"type" : "Roll",
			"data" : "Angles",
			"units" : "Deg",
			"name" : "ROLL",
			"expression" : "(x*pi/180)",
			"sk_path" : "navigation.attitude" },

			{"type" : "Yaw",
			"data" : "Angles",
			"units" : "Deg",
			"name" : "YAW",
			"expression" : "(x*pi/180)",
			"sk_path" : "navigation.attitude" } 
]}
